/**
 * loadInputs.ts – Load phase-1 and phase-2 outputs into typed summaries.
 *
 * Phase-1 files read:
 *   indexes/files.jsonl            – all repo file paths
 *   project-dna/conventions.json  – linting / formatting conventions
 *   project-dna/rules.json        – explicit coding rules
 *   project-dna/tokens.json       – CSS / design tokens
 *   project-dna/manifest.json     – optional project manifest
 *
 * Phase-2 files read:
 *   impact_analysis.json          – impacted files + area summaries
 *   clarifying_questions.json     – clarifying questions (blocking check)
 *   phase2_run.json               – run metadata (prd path for re-read)
 */

import fs from "node:fs";
import path from "node:path";
import type {
  Phase1Summary,
  Phase2Summary,
  ImpactArea,
} from "../contracts/phase3";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readJsonLines<T>(filePath: string): T[] {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as T);
  } catch {
    return [];
  }
}

function tryReadText(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Phase-1 loader
// ---------------------------------------------------------------------------

export interface LoadPhase1Result {
  summary: Phase1Summary;
  warnings: string[];
}

export async function loadPhase1(phase1Dir: string): Promise<LoadPhase1Result> {
  const warnings: string[] = [];
  const indexesDir = path.join(phase1Dir, "indexes");
  const dnaDir = path.join(phase1Dir, "project-dna");

  // ── File list ─────────────────────────────────────────────────────────
  const filesJsonl = path.join(indexesDir, "files.jsonl");
  const fileEntries = readJsonLines<{ file: string }>(filesJsonl);
  const allFiles = fileEntries.map((e) => e.file);

  if (allFiles.length === 0) {
    warnings.push(
      `Could not read file list from ${filesJsonl} – file path validation will be skipped`
    );
  } else {
    console.log(`  Loaded ${allFiles.length} file paths from files.jsonl`);
  }

  // ── Conventions ───────────────────────────────────────────────────────
  const conventionsPath = path.join(dnaDir, "conventions.json");
  const conventionsRaw = readJson<Record<string, unknown>>(conventionsPath);
  const conventions: Record<string, unknown> = conventionsRaw ?? {};
  if (!conventionsRaw) {
    warnings.push(`conventions.json not found at ${conventionsPath}`);
  }

  // ── Rules ─────────────────────────────────────────────────────────────
  const rulesPath = path.join(dnaDir, "rules.json");
  const rulesRaw = readJson<{ rules?: string[] } | Record<string, unknown>>(rulesPath);
  const rules: Record<string, unknown> = rulesRaw ?? {};
  if (!rulesRaw) {
    warnings.push(`rules.json not found at ${rulesPath}`);
  }

  // ── Tokens ────────────────────────────────────────────────────────────
  const tokensPath = path.join(dnaDir, "tokens.json");
  const tokensRaw = readJson<{ tokens?: Array<{ name: string; value: string; file?: string }> } | Record<string, unknown>>(
    tokensPath
  );

  // Flatten tokens to a simple key->value map for easier consumption
  let tokens: Record<string, unknown> = {};
  if (tokensRaw && "tokens" in tokensRaw && Array.isArray(tokensRaw.tokens)) {
    for (const t of tokensRaw.tokens.slice(0, 30)) {
      if (t.name && t.value) {
        tokens[t.name] = t.value;
      }
    }
  } else if (tokensRaw) {
    tokens = tokensRaw as Record<string, unknown>;
  } else {
    warnings.push(`tokens.json not found at ${tokensPath}`);
  }

  // ── Project DNA examples ──────────────────────────────────────────────
  const manifestPath = path.join(dnaDir, "manifest.json");
  const manifest = readJson<unknown>(manifestPath);

  const patternCardsPath = path.join(dnaDir, "pattern-cards.json");
  const patternCards = readJson<unknown>(patternCardsPath);

  const projectDna: unknown[] = [];
  if (manifest) projectDna.push(manifest);
  if (patternCards) projectDna.push(patternCards);

  return {
    summary: {
      allFiles,
      conventions,
      rules,
      tokens,
      projectDna,
    },
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Phase-2 loader
// ---------------------------------------------------------------------------

export interface LoadPhase2Result {
  summary: Phase2Summary;
  prdText: string | null;
  warnings: string[];
}

interface Phase2RunMeta {
  prdPath?: string;
  phase1OutDir?: string;
}

interface ImpactFile {
  path: string;
  score: number;
  role: string;
  reasons: string[];
}

interface AreaSummary {
  area: ImpactArea;
  confidence: number;
  rationale: string[];
}

interface ImpactAnalysis {
  prd?: { hash?: string; source?: string };
  generatedAt?: string;
  files?: ImpactFile[];
  summary?: {
    areas?: AreaSummary[];
  };
  notes?: string[];
}

interface ClarifyingQuestion {
  id: string;
  questionText: string;
  type: string;
  required: boolean;
  options?: string[];
  rationale?: string;
}

export async function loadPhase2(phase2Dir: string): Promise<LoadPhase2Result> {
  const warnings: string[] = [];

  // ── impact_analysis.json ──────────────────────────────────────────────
  const impactPath = path.join(phase2Dir, "impact_analysis.json");
  const impact = readJson<ImpactAnalysis>(impactPath);

  if (!impact) {
    throw new Error(
      `Phase-2 impact_analysis.json not found or invalid at: ${impactPath}\n` +
        `Run pipe-2 first to produce this file.`
    );
  }

  // ── clarifying_questions.json ─────────────────────────────────────────
  const questionsPath = path.join(phase2Dir, "clarifying_questions.json");
  const questions = readJson<ClarifyingQuestion[]>(questionsPath) ?? [];
  if (!questions.length) {
    warnings.push(
      `No clarifying questions found at ${questionsPath} – open questions section will be empty`
    );
  }

  // ── phase2_run.json (for PRD path) ────────────────────────────────────
  const runMetaPath = path.join(phase2Dir, "phase2_run.json");
  const runMeta = readJson<Phase2RunMeta>(runMetaPath);
  const prdPathFromMeta = runMeta?.prdPath;

  // ── Try to re-read PRD text ───────────────────────────────────────────
  let prdText: string | null = null;
  if (prdPathFromMeta) {
    prdText = tryReadText(prdPathFromMeta);
    if (!prdText) {
      warnings.push(
        `Could not re-read PRD from ${prdPathFromMeta} – acceptance criteria will be synthesised`
      );
    }
  }

  // ── Extract newFilesSuggested from notes ─────────────────────────────
  const notes = impact.notes ?? [];
  const newFilesSuggested: string[] = [];
  for (const note of notes) {
    // Pattern: "Suggested new file: src/foo/bar.ts"
    const match = note.match(/suggested new file[:\s]+([^\s,]+)/i);
    if (match) newFilesSuggested.push(match[1]);
  }

  const summary: Phase2Summary = {
    prdHash: impact.prd?.hash ?? "",
    prdSource: impact.prd?.source ?? prdPathFromMeta,
    impactedFiles: (impact.files ?? []).map((f) => ({
      path: f.path,
      score: f.score,
      role: f.role,
      reasons: f.reasons ?? [],
    })),
    areaSummaries: (impact.summary?.areas ?? []).map((a) => ({
      area: a.area,
      confidence: a.confidence,
      rationale: a.rationale ?? [],
    })),
    questions: questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      type: q.type,
      required: q.required,
      options: q.options,
      rationale: q.rationale,
    })),
    newFilesSuggested,
    notes,
  };

  console.log(
    `  Loaded impact analysis: ${summary.impactedFiles.length} files, ${summary.areaSummaries.length} areas`
  );
  console.log(
    `  Loaded ${questions.length} clarifying questions (${questions.filter((q) => q.required).length} required)`
  );

  return { summary, prdText, warnings };
}
