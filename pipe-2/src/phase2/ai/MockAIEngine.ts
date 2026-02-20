/**
 * MockAIEngine.ts – Heuristics-based AI engine that works entirely offline.
 *
 * Algorithm overview
 * ──────────────────
 * 1. Extract keywords + code tokens from PRD text.
 * 2. Seed file collection:
 *    a. Scan search_index docs: score each doc by term overlap with PRD.
 *    b. Scan symbol_index: score each symbol's file by symbol-name overlap.
 * 3. Graph expansion via depgraph (depth ≤ maxDepth, both directions).
 *    Apply depth-decay to expanded files.
 * 4. Merge, normalise, threshold, and sort scored files.
 * 5. Assign roles: primary (score ≥ 0.6), secondary (≥ 0.3), else dependency/dependent.
 * 6. Classify impacted areas and compute per-area confidence.
 * 7. Produce clarifying questions when:
 *    - Ambiguity signals ("TBD", "?", "maybe" …) are found in the PRD, OR
 *    - Confidence of any top area is below 0.4, OR
 *    - Total impacted primary files < 2.
 */

import {
  AIEngine,
  AnalyzeInput,
  AnalyzeOutput,
  ImpactFile,
  ImpactArea,
  Question,
  ImpactAnalysis,
  FileRole,
  Phase1Indexes,
} from "../../contracts/phase2";
import {
  extractKeywords,
  extractCodeTokens,
  detectAmbiguitySignals,
  hashText,
} from "../utils/text";
import {
  ScoredFile,
  computeRawScore,
  mergeScored,
  normaliseScores,
  sortByScore,
  filterByThreshold,
} from "../utils/scoring";
import { classifyFile, computeAreaConfidences } from "../utils/classify";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRAPH_MAX_DEPTH = 2;
const SCORE_THRESHOLD = 0.05;
const MAX_IMPACT_FILES = 40;
const PRIMARY_THRESHOLD = 0.55;
const SECONDARY_THRESHOLD = 0.25;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Given a set of seed file paths and the depgraph, expand up to maxDepth hops
 * in forward and reverse directions.  Returns a map of path -> hop distance.
 */
function expandGraph(
  seeds: Set<string>,
  indexes: Phase1Indexes,
  maxDepth: number,
): Map<string, number> {
  const { adjacency, reverseAdjacency } = indexes.depGraph;
  const visited = new Map<string, number>();

  // Initialise queue with seeds at distance 0
  const queue: Array<{ path: string; depth: number }> = [];
  for (const seed of seeds) {
    if (!visited.has(seed)) {
      visited.set(seed, 0);
      queue.push({ path: seed, depth: 0 });
    }
  }

  let head = 0;
  while (head < queue.length) {
    const { path, depth } = queue[head++]!;
    if (depth >= maxDepth) continue;

    const nextDepth = depth + 1;
    const neighbours = [
      ...(adjacency[path] ?? []),
      ...(reverseAdjacency[path] ?? []),
    ];

    for (const neighbour of neighbours) {
      if (!visited.has(neighbour)) {
        visited.set(neighbour, nextDepth);
        queue.push({ path: neighbour, depth: nextDepth });
      }
    }
  }

  return visited;
}

/**
 * Determine whether a path is a dependency (forward edge from seed) or
 * dependent (reverse edge from seed).
 */
function inferRole(path: string, seeds: Set<string>, score: number): FileRole {
  if (seeds.has(path)) {
    return score >= PRIMARY_THRESHOLD ? "primary" : "secondary";
  }
  return score >= SECONDARY_THRESHOLD ? "dependency" : "dependent";
}

// ---------------------------------------------------------------------------
// Question templates
// ---------------------------------------------------------------------------

interface QuestionTemplate {
  id: string;
  questionText: string;
  type: Question["type"];
  required: boolean;
  options?: string[];
  rationale: string;
  trigger: "always" | "ambiguity" | "low_confidence" | "few_primary";
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: "q-scope-1",
    questionText:
      "Which user roles or personas are primarily affected by this change?",
    type: "multi_select",
    required: true,
    options: ["Admin", "End User", "Guest", "API Consumer", "All roles"],
    rationale:
      "Scope of impacted users affects which auth/permission files need changes.",
    trigger: "always",
  },
  {
    id: "q-scope-2",
    questionText:
      "Should the feature be behind a feature flag / gradual rollout?",
    type: "single_select",
    required: false,
    options: [
      "Yes – feature flag",
      "Yes – gradual rollout",
      "No – immediate for all",
      "TBD",
    ],
    rationale: "Affects config, routing and possibly state management files.",
    trigger: "ambiguity",
  },
  {
    id: "q-data-1",
    questionText:
      "Does this change introduce new data entities or modify existing schemas?",
    type: "single_select",
    required: true,
    options: [
      "New entities only",
      "Modify existing schemas",
      "Both",
      "No schema changes",
    ],
    rationale:
      "Schema changes cascade to types/, API layer and state management.",
    trigger: "always",
  },
  {
    id: "q-api-1",
    questionText:
      "Are new API endpoints required, or are existing endpoints being modified?",
    type: "single_select",
    required: true,
    options: ["New endpoints", "Modify existing", "Both", "No API changes"],
    rationale: "Determines scope in services/api layer.",
    trigger: "always",
  },
  {
    id: "q-ui-1",
    questionText:
      "Which UI surfaces (pages/screens) need to be created or modified?",
    type: "text",
    required: false,
    rationale: "Narrows which page/component files will be impacted.",
    trigger: "low_confidence",
  },
  {
    id: "q-auth-1",
    questionText:
      "Does this feature require new authentication or authorisation rules?",
    type: "single_select",
    required: true,
    options: [
      "New auth rules",
      "Modify existing rules",
      "No auth changes",
      "Unknown",
    ],
    rationale: "Auth/session changes have a wide blast radius.",
    trigger: "ambiguity",
  },
  {
    id: "q-migration-1",
    questionText: "Is a data migration or database schema change needed?",
    type: "single_select",
    required: false,
    options: ["Yes", "No", "TBD"],
    rationale: "Migrations can trigger dependency changes across services.",
    trigger: "ambiguity",
  },
  {
    id: "q-tbd-1",
    questionText:
      'The PRD contains unresolved items marked as "TBD" or "TBA". Please clarify these before implementation starts.',
    type: "text",
    required: true,
    rationale: "Unresolved PRD items lead to rework.",
    trigger: "ambiguity",
  },
];

function pickQuestions(
  ambiguitySignals: string[],
  lowConfidence: boolean,
  fewPrimary: boolean,
): Question[] {
  const triggers = new Set<QuestionTemplate["trigger"]>(["always"]);
  if (ambiguitySignals.length > 0) triggers.add("ambiguity");
  if (lowConfidence) triggers.add("low_confidence");
  if (fewPrimary) triggers.add("few_primary");

  const picked: Question[] = [];
  for (const tpl of QUESTION_TEMPLATES) {
    if (triggers.has(tpl.trigger) || tpl.trigger === "always") {
      picked.push({
        id: tpl.id,
        questionText: tpl.questionText,
        type: tpl.type,
        required: tpl.required,
        ...(tpl.options ? { options: tpl.options } : {}),
        rationale: tpl.rationale,
      });
    }
    if (picked.length >= 8) break; // cap at 8 per spec
  }

  return picked;
}

// ---------------------------------------------------------------------------
// MockAIEngine
// ---------------------------------------------------------------------------

export class MockAIEngine implements AIEngine {
  readonly name = "MockAIEngine";

  async analyze(input: AnalyzeInput): Promise<AnalyzeOutput> {
    const { prdText, prdMeta, indexes } = input;
    const generatedAt = new Date().toISOString();

    // ── Step 1: Extract PRD tokens ──────────────────────────────────────────
    const keywords = extractKeywords(prdText);
    const codeTokens = extractCodeTokens(prdText);
    const allTokens = [...new Set([...keywords, ...codeTokens])];
    const tokenSet = new Set(allTokens.map((t) => t.toLowerCase()));
    const ambiguitySignals = detectAmbiguitySignals(prdText);

    console.log(
      `  [MockAI] PRD tokens: ${keywords.length} keywords, ${codeTokens.length} code tokens`,
    );
    console.log(
      `  [MockAI] Ambiguity signals: ${ambiguitySignals.length > 0 ? ambiguitySignals.join(", ") : "none"}`,
    );

    // ── Step 2: Seed scoring from search index ──────────────────────────────
    const rawScored: ScoredFile[] = [];

    for (const doc of indexes.searchDocs) {
      const docWords = new Set(
        [doc.file, ...doc.tags, doc.text ?? ""]
          .join(" ")
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length >= 2),
      );

      const matched: string[] = [];
      for (const token of tokenSet) {
        if (docWords.has(token)) matched.push(token);
        // partial path match
        if (doc.file.toLowerCase().includes(token)) {
          if (!matched.includes(token)) matched.push(token);
        }
      }

      if (matched.length === 0) continue;

      rawScored.push({
        path: doc.file,
        score: computeRawScore(matched.length, 0, 0),
        matchedTerms: matched,
        matchedSymbols: [],
        depDistance: 0,
      });
    }

    // ── Step 3: Seed scoring from symbol index ───────────────────────────────
    for (const [symbolName, meta] of Object.entries(indexes.symbolIndex)) {
      const symLower = symbolName.toLowerCase();
      const matchedSyms: string[] = [];
      const matchedTerms: string[] = [];

      for (const token of tokenSet) {
        if (symLower.includes(token) || token.includes(symLower)) {
          matchedSyms.push(symbolName);
          matchedTerms.push(token);
        }
        // Exact PascalCase or camelCase symbol match
        if (symLower === token) {
          matchedSyms.push(symbolName);
          matchedTerms.push(token);
        }
      }

      if (matchedSyms.length === 0) continue;

      rawScored.push({
        path: meta.file,
        score: computeRawScore(0, matchedSyms.length, 0),
        matchedTerms: [...new Set(matchedTerms)],
        matchedSymbols: [...new Set(matchedSyms)],
        depDistance: 0,
      });
    }

    // ── Step 4: Merge seed scores ────────────────────────────────────────────
    const seeds = mergeScored(rawScored);
    const seedPaths = new Set(seeds.map((s) => s.path));

    console.log(`  [MockAI] Seed files: ${seeds.length}`);

    // ── Step 5: Graph expansion ──────────────────────────────────────────────
    const expansionMap = expandGraph(seedPaths, indexes, GRAPH_MAX_DEPTH);
    const expandedScored: ScoredFile[] = [];

    for (const [expandedPath, depth] of expansionMap) {
      if (seedPaths.has(expandedPath) || depth === 0) continue;
      // Score based purely on depth decay (no direct token match)
      const baseScore = computeRawScore(1, 0, depth);
      expandedScored.push({
        path: expandedPath,
        score: baseScore,
        matchedTerms: [],
        matchedSymbols: [],
        depDistance: depth,
      });
    }

    // ── Step 6: Merge all ────────────────────────────────────────────────────
    const allScored = mergeScored([...seeds, ...expandedScored]);
    const normalised = normaliseScores(allScored);
    const filtered = filterByThreshold(normalised, SCORE_THRESHOLD);
    const sorted = sortByScore(filtered).slice(0, MAX_IMPACT_FILES);

    console.log(`  [MockAI] Impacted files after filtering: ${sorted.length}`);

    // ── Step 7: Build ImpactFile list ─────────────────────────────────────────
    const impactFiles: ImpactFile[] = sorted.map((sf) => {
      const role = inferRole(sf.path, seedPaths, sf.score);
      const reasons: string[] = [];

      if (sf.matchedTerms.length > 0)
        reasons.push(
          `Matched PRD terms: ${sf.matchedTerms.slice(0, 5).join(", ")}`,
        );
      if (sf.matchedSymbols.length > 0)
        reasons.push(
          `Matched symbols: ${sf.matchedSymbols.slice(0, 3).join(", ")}`,
        );
      if (sf.depDistance > 0)
        reasons.push(
          `Reachable via dependency graph at depth ${sf.depDistance}`,
        );

      return {
        path: sf.path,
        score: Math.round(sf.score * 1000) / 1000,
        role,
        reasons,
        evidence: {
          ...(sf.matchedTerms.length > 0
            ? { matchedTerms: sf.matchedTerms }
            : {}),
          ...(sf.matchedSymbols.length > 0
            ? { matchedSymbols: sf.matchedSymbols }
            : {}),
          depDistance: sf.depDistance,
        },
      };
    });

    // ── Step 8: Area classification ───────────────────────────────────────────
    const areaConf = computeAreaConfidences(
      sorted.map((s) => ({ path: s.path, score: s.score })),
    );

    // ── Step 9: Summary ───────────────────────────────────────────────────────
    const primaryCount = impactFiles.filter((f) => f.role === "primary").length;
    const secondaryCount = impactFiles.filter(
      (f) => f.role === "secondary",
    ).length;

    const topAreaConfidence = areaConf[0]?.confidence ?? 0;
    const lowConfidence = topAreaConfidence < 0.4;
    const fewPrimary = primaryCount < 2;

    // ── Step 10: Questions ────────────────────────────────────────────────────
    const questions = pickQuestions(
      ambiguitySignals,
      lowConfidence,
      fewPrimary,
    );

    // ── Step 11: Build ImpactAnalysis ─────────────────────────────────────────
    const impact: ImpactAnalysis = {
      prd: prdMeta,
      generatedAt,
      summary: {
        primaryCount,
        secondaryCount,
        areas: areaConf.map((a) => ({
          area: a.area as ImpactArea,
          confidence: Math.round(a.confidence * 1000) / 1000,
          rationale: a.rationale,
        })),
      },
      files: impactFiles,
      graphExpansion: {
        enabled: true,
        direction: "both",
        maxDepth: GRAPH_MAX_DEPTH,
      },
      notes: [
        `Analyzed using MockAIEngine (heuristics-only, no external API).`,
        `PRD tokens extracted: ${allTokens.length}.`,
        `Search index docs scanned: ${indexes.searchDocs.length}.`,
        `Symbol index entries scanned: ${Object.keys(indexes.symbolIndex).length}.`,
        ...(ambiguitySignals.length > 0
          ? [`Ambiguity signals detected: ${ambiguitySignals.join(", ")}.`]
          : []),
      ],
    };

    const output: AnalyzeOutput = {
      questions,
      impact,
      notes: impact.notes,
    };

    return output;
  }
}
