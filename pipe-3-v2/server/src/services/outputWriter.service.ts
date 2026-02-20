/**
 * outputWriter.service.ts – Write pipe-3 compatible output files.
 */

import fs from "node:fs";
import path from "node:path";
import type { RunSession } from "./sessionManager.service";
import type { Phase3RunMeta } from "../contracts/phase3";

export function writeSessionOutput(session: RunSession): void {
  const outDir = session.outputDir;
  fs.mkdirSync(outDir, { recursive: true });

  // 1. roadmap.json
  if (session.roadmap) {
    const roadmapPath = path.join(outDir, "roadmap.json");
    fs.writeFileSync(roadmapPath, JSON.stringify(session.roadmap, null, 2));
    console.log(`  [output] Wrote ${roadmapPath}`);
  }

  // 2. agent_prompt_pack.json
  if (session.promptPack) {
    const promptPath = path.join(outDir, "agent_prompt_pack.json");
    fs.writeFileSync(promptPath, JSON.stringify(session.promptPack, null, 2));
    console.log(`  [output] Wrote ${promptPath}`);
  }

  // 3. phase3_run.json (metadata)
  const now = new Date().toISOString();
  const meta: Phase3RunMeta = {
    runId: session.runId,
    phase1OutDir: session.phase1Dir,
    phase2OutDir: session.phase2Dir,
    outDir: session.outputDir,
    startedAt: session.createdAt,
    finishedAt: now,
    durationMs: new Date(now).getTime() - new Date(session.createdAt).getTime(),
    status: session.status === "error" ? "error" : "success",
    error: session.error,
    engineName: "OpenAIEngine (gpt-4o)",
  };
  const metaPath = path.join(outDir, "phase3_run.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`  [output] Wrote ${metaPath}`);
}
