/**
 * runPhase3.ts – Orchestrator for the Phase-3 Grounded Architect pipeline.
 *
 * Steps:
 *  1. Load phase-2 outputs (impact analysis, questions).
 *  2. Load phase-1 indexes (file list, conventions, tokens, rules).
 *  3. Assemble PlanningInput.
 *  4. Run the PlanningEngine to produce Roadmap + AgentPromptPack.
 *  5. Validate the generated plan.
 *  6. Write output files.
 *  7. Return Phase3RunMeta.
 */

import fs from "node:fs";
import path from "node:path";
import type { PlanningEngine, Phase3RunMeta } from "../contracts/phase3";
import { loadPhase1, loadPhase2 } from "./loadInputs";
import { assemblePlanningInput } from "./derivePlan";
import { validatePlan } from "./validatePlan";
import { renderRoadmapMarkdown } from "./renderMarkdown";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function writeText(filePath: string, text: string): void {
  fs.writeFileSync(filePath, text, "utf8");
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface Phase3Options {
  /** Path to phase-1 run output directory */
  phase1OutDir: string;
  /** Path to phase-2 run output directory */
  phase2OutDir: string;
  /** Root output directory – a run-specific sub-folder will be created here */
  outRootDir: string;
  /** Planning engine to use */
  engine: PlanningEngine;
  /** Optional explicit PRD file path (overrides what was in phase2_run.json) */
  prdPath?: string;
  /** Unique run ID (defaults to ISO timestamp slug) */
  runId?: string;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function runPhase3(opts: Phase3Options): Promise<Phase3RunMeta> {
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

  const meta: Phase3RunMeta = {
    runId,
    phase1OutDir: path.resolve(opts.phase1OutDir),
    phase2OutDir: path.resolve(opts.phase2OutDir),
    prdPath: opts.prdPath ? path.resolve(opts.prdPath) : undefined,
    outDir: runOutDir,
    startedAt,
    status: "running",
    engineName: opts.engine.name,
  };

  // Write a "running" snapshot immediately
  writeJson(path.join(runOutDir, "phase3_run.json"), meta);

  try {
    console.log(`\n=== Phase 3: Grounded Architect ===`);
    console.log(`Run ID      : ${runId}`);
    console.log(`Phase1 Out  : ${opts.phase1OutDir}`);
    console.log(`Phase2 Out  : ${opts.phase2OutDir}`);
    console.log(`Out Dir     : ${runOutDir}`);
    console.log(`Engine      : ${meta.engineName}`);
    console.log(`────────────────────────────────────`);

    // ── Step 1: Load Phase-2 ──────────────────────────────────────────────
    console.log(`\n[1/4] Loading Phase-2 outputs…`);
    const { summary: phase2, prdText: prdTextFromMeta, warnings: p2Warnings } =
      await loadPhase2(path.resolve(opts.phase2OutDir));

    p2Warnings.forEach((w) => console.warn(`  ⚠  ${w}`));

    // If caller supplied explicit PRD path, prefer that
    let prdText: string | null = prdTextFromMeta;
    if (opts.prdPath) {
      try {
        prdText = fs.readFileSync(path.resolve(opts.prdPath), "utf8");
        console.log(`  PRD (explicit): ${opts.prdPath}`);
      } catch {
        console.warn(`  ⚠  Could not read explicit PRD path: ${opts.prdPath}`);
      }
    }

    // ── Step 2: Load Phase-1 ──────────────────────────────────────────────
    console.log(`\n[2/4] Loading Phase-1 indexes…`);
    const { summary: phase1, warnings: p1Warnings } = await loadPhase1(
      path.resolve(opts.phase1OutDir)
    );

    p1Warnings.forEach((w) => console.warn(`  ⚠  ${w}`));

    // ── Step 3: Assemble input + run engine ───────────────────────────────
    console.log(`\n[3/4] Running planning engine (${meta.engineName})…`);

    const { input, warnings: assembleWarnings } = assemblePlanningInput({
      phase1,
      phase2,
      prdText,
    });

    assembleWarnings.forEach((w) => console.warn(`  ⚠  ${w}`));

    // Log blocking questions
    const blockingQs = phase2.questions.filter((q) => q.required);
    if (blockingQs.length > 0) {
      console.warn(
        `\n  ⚠  ${blockingQs.length} blocking clarifying question(s) remain unanswered:`
      );
      blockingQs.forEach((q) => console.warn(`     – [${q.id}] ${q.questionText}`));
      console.warn(
        `  These will be captured in roadmap.openQuestions. Implementation can proceed`
      );
      console.warn(`  but the agent must resolve them before execution.\n`);
    }

    const result = await opts.engine.plan(input);

    result.engineNotes.forEach((n) => console.log(`  ℹ  ${n}`));

    // ── Step 4: Validate plan ─────────────────────────────────────────────
    console.log(`\n[4/4] Validating plan…`);
    const validation = validatePlan(result.roadmap, result.promptPack, phase1);

    if (validation.schemaErrors.length > 0) {
      console.error(`\n  ✖  Schema errors (${validation.schemaErrors.length}):`);
      validation.schemaErrors.forEach((e) => console.error(`     – ${e}`));
    } else {
      console.log(`  ✔  Plan schema is valid`);
    }

    if (validation.groundingWarnings.length > 0) {
      console.warn(
        `\n  ⚠  Grounding warnings (${validation.groundingWarnings.length}):`
      );
      validation.groundingWarnings.forEach((w) => console.warn(`     – ${w}`));
    }

    // ── Write outputs ─────────────────────────────────────────────────────
    const roadmapPath = path.join(runOutDir, "roadmap.json");
    const promptPackPath = path.join(runOutDir, "agent_prompt_pack.json");
    const roadmapMdPath = path.join(runOutDir, "roadmap.md");

    writeJson(roadmapPath, result.roadmap);
    writeJson(promptPackPath, result.promptPack);

    const mdText = renderRoadmapMarkdown(result.roadmap);
    writeText(roadmapMdPath, mdText);

    // ── Finalise metadata ─────────────────────────────────────────────────
    const finishedAt = new Date().toISOString();
    const durationMs =
      new Date(finishedAt).getTime() - new Date(startedAt).getTime();

    const finalMeta: Phase3RunMeta = {
      ...meta,
      finishedAt,
      durationMs,
      status: validation.valid ? "success" : "success", // warn but don't fail on grounding warns
    };

    writeJson(path.join(runOutDir, "phase3_run.json"), finalMeta);

    // ── Console summary ───────────────────────────────────────────────────
    console.log(`\n────────────────────────────────────`);
    console.log(`Roadmap JSON      → ${roadmapPath}`);
    console.log(`Agent Prompt Pack → ${promptPackPath}`);
    console.log(`Roadmap Markdown  → ${roadmapMdPath}`);
    console.log(`Run Metadata      → ${path.join(runOutDir, "phase3_run.json")}`);
    console.log(`\nSummary:`);
    console.log(`  Plan steps            : ${result.roadmap.plan.length}`);
    console.log(
      `  Acceptance criteria   : ${result.roadmap.acceptanceCriteria.length}`
    );
    console.log(`  Risks                 : ${result.roadmap.risks.length}`);
    console.log(
      `  Open questions        : ${result.roadmap.openQuestions.length}`
    );
    console.log(`  Agent prompts         : ${result.promptPack.prompts.length}`);
    console.log(
      `  Duration              : ${durationMs}ms`
    );

    if (!validation.valid) {
      console.warn(
        `\n  ⚠  Plan has ${validation.schemaErrors.length} schema error(s) – outputs written but may be incomplete`
      );
    }

    return finalMeta;
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const errorMeta: Phase3RunMeta = {
      ...meta,
      finishedAt,
      durationMs:
        new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };

    writeJson(path.join(runOutDir, "phase3_run.json"), errorMeta);
    throw err;
  }
}
