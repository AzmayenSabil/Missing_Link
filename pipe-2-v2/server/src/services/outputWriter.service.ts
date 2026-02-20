/**
 * outputWriter.service.ts – Write final JSON files to out/pipe-2/<runId>/
 *
 * Produces output files matching existing pipe-2 format for pipe-3 compatibility:
 *   - impact_analysis.json
 *   - clarifying_questions.json
 *   - phase2_run.json
 */

import fs from "node:fs";
import path from "node:path";
import type {
  ImpactAnalysis,
  Question,
  Answer,
  Phase2RunMeta,
} from "../contracts/phase2";
import type { RunSession } from "./sessionManager.service";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`  [outputWriter] Written: ${filePath}`);
}

/**
 * Write all pipe-2 output files for a completed session.
 */
export function writeSessionOutput(session: RunSession): void {
  const outDir = session.outputDir;
  ensureDir(outDir);

  // 1. impact_analysis.json
  if (session.impactAnalysis) {
    writeJson(
      path.join(outDir, "impact_analysis.json"),
      session.impactAnalysis,
    );
  }

  // 2. clarifying_questions.json (questions array without answers, matching pipe-2 format)
  const questionsOutput = session.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    type: q.type,
    required: q.required,
    ...(q.options ? { options: q.options } : {}),
    ...(q.rationale ? { rationale: q.rationale } : {}),
  }));
  writeJson(
    path.join(outDir, "clarifying_questions.json"),
    questionsOutput,
  );

  // 3. Also write answers alongside questions for reference
  if (session.answers.length > 0) {
    const answersOutput = session.answers.map((a) => ({
      questionId: a.questionId,
      value: a.value,
    }));
    writeJson(
      path.join(outDir, "clarifying_answers.json"),
      answersOutput,
    );
  }

  // 4. phase2_run.json
  const now = new Date().toISOString();
  const startedAt = session.createdAt;
  const durationMs = new Date(now).getTime() - new Date(startedAt).getTime();

  const runMeta: Phase2RunMeta = {
    runId: session.runId,
    phase1OutDir: session.phase1Dir,
    prdPath: session.prdFileName,
    outDir: outDir,
    startedAt,
    finishedAt: now,
    durationMs,
    status: "success",
    engineName: "OpenAIEngine (gpt-4o)",
  };
  writeJson(path.join(outDir, "phase2_run.json"), runMeta);
}
