/**
 * runPhase2.ts – Orchestrator for the Phase-2 Clarification Bridge pipeline.
 *
 * Steps:
 *  1. Read and normalise the PRD.
 *  2. Load Phase-1 indexes.
 *  3. Run the AI engine to produce impact analysis and clarifying questions.
 *  4. Write output files to the run output directory.
 *  5. Return the Phase2RunMeta record.
 */

import fs from "node:fs";
import path from "node:path";
import { AIEngine, Phase2RunMeta, AnalyzeOutput } from "../contracts/phase2";
import { readPrd } from "./prdReader";
import { loadPhase1 } from "./loadPhase1";

// ---------------------------------------------------------------------------
// Output writer helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// ---------------------------------------------------------------------------
// Phase 2 run options
// ---------------------------------------------------------------------------

export interface Phase2Options {
  /** Path to the phase-1 output folder (contains an 'indexes/' sub-dir) */
  phase1OutDir: string;
  /** Path to the PRD markdown/text file */
  prdPath: string;
  /** Root output directory; a run-specific sub-folder will be created here */
  outRootDir: string;
  /** AI engine to use */
  engine: AIEngine;
  /** Unique run ID (defaults to ISO timestamp slug) */
  runId?: string;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function runPhase2(opts: Phase2Options): Promise<Phase2RunMeta> {
  const startedAt = new Date().toISOString();
  const runId =
    opts.runId ??
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);

  const runOutDir = path.resolve(opts.outRootDir, runId);
  ensureDir(runOutDir);

  // Build initial metadata
  const meta: Phase2RunMeta = {
    runId,
    phase1OutDir: path.resolve(opts.phase1OutDir),
    prdPath: path.resolve(opts.prdPath),
    outDir: runOutDir,
    startedAt,
    status: "running",
    engineName:
      (opts.engine as { name?: string }).name ?? opts.engine.constructor.name,
  };

  // Save a "running" snapshot immediately so crashes are observable
  writeJson(path.join(runOutDir, "phase2_run.json"), meta);

  try {
    console.log(`\n=== Phase 2: Clarification Bridge ===`);
    console.log(`Run ID    : ${runId}`);
    console.log(`PRD       : ${opts.prdPath}`);
    console.log(`Phase1 Out: ${opts.phase1OutDir}`);
    console.log(`Out Dir   : ${runOutDir}`);
    console.log(`Engine    : ${meta.engineName}`);
    console.log(`─────────────────────────────────────`);

    // ── Step 1: Read PRD ──────────────────────────────────────────────────
    console.log(`\n[1/3] Reading PRD…`);
    const prd = readPrd(opts.prdPath);

    // ── Step 2: Load Phase-1 indexes ───────────────────────────────────────
    console.log(`\n[2/3] Loading Phase-1 indexes…`);
    const { indexes, warnings } = await loadPhase1(opts.phase1OutDir);

    if (warnings.length > 0) {
      console.warn("\n  Warnings:");
      warnings.forEach((w) => console.warn(`    ⚠  ${w}`));
    }

    // ── Step 3: Run AI engine ─────────────────────────────────────────────
    console.log(`\n[3/3] Running AI engine (${meta.engineName})…`);
    const result: AnalyzeOutput = await opts.engine.analyze({
      prdText: prd.normalizedText,
      prdMeta: prd.meta,
      indexes,
    });

    // ── Step 4: Write outputs ─────────────────────────────────────────────
    const impactPath = path.join(runOutDir, "impact_analysis.json");
    const questionsPath = path.join(runOutDir, "clarifying_questions.json");

    writeJson(impactPath, result.impact);
    writeJson(questionsPath, result.questions);

    console.log(`\n─────────────────────────────────────`);
    console.log(`Impact analysis  → ${impactPath}`);
    console.log(`Clarifying Qs    → ${questionsPath}`);
    console.log(`\nSummary:`);
    console.log(`  Primary files    : ${result.impact.summary.primaryCount}`);
    console.log(`  Secondary files  : ${result.impact.summary.secondaryCount}`);
    console.log(`  Total impacted   : ${result.impact.files.length}`);
    console.log(
      `  Top areas        : ${result.impact.summary.areas
        .slice(0, 3)
        .map((a) => `${a.area} (${(a.confidence * 100).toFixed(0)}%)`)
        .join(", ")}`,
    );
    console.log(`  Questions        : ${result.questions.length}`);

    const finishedAt = new Date().toISOString();
    const durationMs =
      new Date(finishedAt).getTime() - new Date(startedAt).getTime();

    const finalMeta: Phase2RunMeta = {
      ...meta,
      finishedAt,
      durationMs,
      status: "success",
    };

    writeJson(path.join(runOutDir, "phase2_run.json"), finalMeta);

    console.log(`\n✓ Phase 2 complete in ${durationMs}ms`);
    console.log(`  Output folder: ${runOutDir}`);

    return finalMeta;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`\n✗ Phase 2 failed: ${errorMessage}`);

    const failedMeta: Phase2RunMeta = {
      ...meta,
      finishedAt: new Date().toISOString(),
      status: "error",
      error: errorMessage,
    };

    writeJson(path.join(runOutDir, "phase2_run.json"), failedMeta);
    throw err;
  }
}
