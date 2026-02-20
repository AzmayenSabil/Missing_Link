/**
 * inputLoader.service.ts – Load pipe-1 and pipe-2 outputs into typed summaries.
 * Adapted from pipe-3/src/phase3/loadInputs.ts for the server context.
 */

import fs from "node:fs";
import path from "node:path";
import type {
  Phase1Summary,
  Phase2Summary,
  ImpactAnalysis,
  ImpactFile,
  AreaSummary,
  ClarifyingQuestion,
  ClarifyingAnswer,
  ImpactArea,
} from "../contracts/phase3";
import { config } from "../config/env";

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
// List available runs
// ---------------------------------------------------------------------------

export interface RunPair {
  phase1RunId: string;
  phase1Path: string;
  phase2RunId: string;
  phase2Path: string;
  projectId?: string;
  scannedAt?: string;
}

/**
 * Scan out/pipe-1/ and out/pipe-2/ directories to find matching run pairs.
 */
export function listAvailableRuns(): RunPair[] {
  const outDir = config.outDir;
  const pipe1Dir = path.join(outDir, "pipe-1");
  const pipe2Dir = path.join(outDir, "pipe-2");

  const pairs: RunPair[] = [];

  // List pipe-2 runs (each must have impact_analysis.json)
  if (!fs.existsSync(pipe2Dir)) return pairs;

  const pipe2Runs = fs.readdirSync(pipe2Dir).filter((d) => {
    const impactPath = path.join(pipe2Dir, d, "impact_analysis.json");
    return fs.existsSync(impactPath);
  });

  for (const p2Id of pipe2Runs) {
    const p2Path = path.join(pipe2Dir, p2Id);
    const runMeta = readJson<{ phase1OutDir?: string }>(
      path.join(p2Path, "phase2_run.json"),
    );

    // Try to find the pipe-1 run this came from
    let phase1RunId = "";
    let phase1Path = "";

    if (runMeta?.phase1OutDir) {
      phase1Path = runMeta.phase1OutDir;
      phase1RunId = path.basename(phase1Path);
    } else if (fs.existsSync(pipe1Dir)) {
      // Fallback: use the first pipe-1 run found
      const pipe1Runs = fs.readdirSync(pipe1Dir);
      if (pipe1Runs.length > 0) {
        phase1RunId = pipe1Runs[0];
        phase1Path = path.join(pipe1Dir, phase1RunId);
      }
    }

    // Read manifest for project info
    const manifest = readJson<{ projectId?: string; scannedAt?: string }>(
      path.join(phase1Path, "project-dna", "manifest.json"),
    );

    pairs.push({
      phase1RunId,
      phase1Path,
      phase2RunId: p2Id,
      phase2Path: p2Path,
      projectId: manifest?.projectId,
      scannedAt: manifest?.scannedAt,
    });
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Phase-1 loader
// ---------------------------------------------------------------------------

export interface LoadPhase1Result {
  summary: Phase1Summary;
  warnings: string[];
}

export function loadPhase1(phase1Dir: string): LoadPhase1Result {
  const warnings: string[] = [];
  const indexesDir = path.join(phase1Dir, "indexes");
  const dnaDir = path.join(phase1Dir, "project-dna");

  // File list
  const filesJsonl = path.join(indexesDir, "files.jsonl");
  const fileEntries = readJsonLines<{ file: string }>(filesJsonl);
  const allFiles = fileEntries.map((e) => e.file);

  if (allFiles.length === 0) {
    warnings.push(`Could not read file list from ${filesJsonl}`);
  }

  // Conventions
  const conventions = readJson<Record<string, unknown>>(
    path.join(dnaDir, "conventions.json"),
  ) ?? {};

  // Rules
  const rules = readJson<Record<string, unknown>>(
    path.join(dnaDir, "rules.json"),
  ) ?? {};

  // Tokens
  const tokensRaw = readJson<{ tokens?: Array<{ name: string; value: string }> } | Record<string, unknown>>(
    path.join(dnaDir, "tokens.json"),
  );

  let tokens: Record<string, unknown> = {};
  if (tokensRaw && "tokens" in tokensRaw && Array.isArray(tokensRaw.tokens)) {
    for (const t of tokensRaw.tokens.slice(0, 30)) {
      if (t.name && t.value) {
        tokens[t.name] = t.value;
      }
    }
  } else if (tokensRaw) {
    tokens = tokensRaw as Record<string, unknown>;
  }

  // Project DNA extras
  const projectDna: unknown[] = [];
  const manifest = readJson<unknown>(path.join(dnaDir, "manifest.json"));
  if (manifest) projectDna.push(manifest);

  return {
    summary: { allFiles, conventions, rules, tokens, projectDna },
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Phase-2 loader
// ---------------------------------------------------------------------------

export interface LoadPhase2Result {
  summary: Phase2Summary;
  impact: ImpactAnalysis;
  prdText: string | null;
  warnings: string[];
}

const VALID_AREAS: ImpactArea[] = [
  "UI", "Hooks", "State", "API/Service", "Auth",
  "Routing", "Styling", "Types", "Tests", "Build/Config", "Unknown",
];

export function loadPhase2(phase2Dir: string): LoadPhase2Result {
  const warnings: string[] = [];

  // Impact analysis
  const impactPath = path.join(phase2Dir, "impact_analysis.json");
  const impactRaw = readJson<ImpactAnalysis>(impactPath);

  if (!impactRaw) {
    throw new Error(
      `Phase-2 impact_analysis.json not found at: ${impactPath}\n` +
        `Run pipe-2 first to produce this file.`,
    );
  }

  // Normalize impact data
  const files: ImpactFile[] = (impactRaw.files ?? []).map((f) => ({
    path: f.path,
    score: Math.min(1, Math.max(0, f.score ?? 0)),
    role: f.role ?? "secondary",
    reasons: f.reasons ?? [],
    evidence: f.evidence,
  }));

  const areas: AreaSummary[] = (impactRaw.summary?.areas ?? [])
    .filter((a) => VALID_AREAS.includes(a.area))
    .map((a) => ({
      area: a.area,
      confidence: Math.min(1, Math.max(0, a.confidence ?? 0)),
      rationale: a.rationale ?? [],
    }));

  const impact: ImpactAnalysis = {
    prd: impactRaw.prd ?? { hash: "" },
    generatedAt: impactRaw.generatedAt ?? new Date().toISOString(),
    summary: {
      primaryCount: files.filter((f) => f.role === "primary").length,
      secondaryCount: files.filter((f) => f.role === "secondary").length,
      areas,
    },
    files,
    graphExpansion: impactRaw.graphExpansion,
    notes: impactRaw.notes ?? [],
  };

  // Questions
  const questions = readJson<ClarifyingQuestion[]>(
    path.join(phase2Dir, "clarifying_questions.json"),
  ) ?? [];

  // Answers
  const answers = readJson<ClarifyingAnswer[]>(
    path.join(phase2Dir, "clarifying_answers.json"),
  ) ?? [];

  // PRD text
  const runMeta = readJson<{ prdPath?: string }>(
    path.join(phase2Dir, "phase2_run.json"),
  );
  let prdText: string | null = null;
  if (runMeta?.prdPath) {
    prdText = tryReadText(runMeta.prdPath);
  }

  // New file suggestions from notes
  const notes = impact.notes ?? [];
  const newFilesSuggested: string[] = [];
  for (const note of notes) {
    const match = note.match(/suggested new file[:\s]+([^\s,]+)/i);
    if (match) newFilesSuggested.push(match[1]);
  }

  const summary: Phase2Summary = {
    prdHash: impact.prd.hash,
    prdSource: impact.prd.source,
    impactedFiles: files,
    areaSummaries: areas,
    questions,
    answers,
    newFilesSuggested,
    notes,
  };

  return { summary, impact, prdText, warnings };
}
