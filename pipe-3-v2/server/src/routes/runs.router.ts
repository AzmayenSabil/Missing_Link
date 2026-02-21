/**
 * runs.router.ts – Create and manage pipe-3-v2 analysis sessions.
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { config } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { generateRunId } from "../utils/id";
import { sessionManager } from "../services/sessionManager.service";
import { loadPhase1, loadPhase2 } from "../services/inputLoader.service";
import { OpenAIEngine } from "../ai/OpenAIEngine";
import { writeSessionOutput } from "../services/outputWriter.service";

export const runsRouter = Router();

/**
 * POST /api/runs
 * Create a new pipe-3-v2 session. Loads inputs and kicks off subtask generation.
 */
runsRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phase1RunId, phase2RunId } = req.body as {
        phase1RunId?: string;
        phase2RunId?: string;
      };

      if (!phase1RunId || !phase2RunId) {
        throw new AppError(
          "MISSING_PARAMS",
          "phase1RunId and phase2RunId are required",
          400,
        );
      }

      const phase1Dir = path.join(config.outDir, "pipe-1", phase1RunId);
      const phase2Dir = path.join(config.outDir, "pipe-2", phase2RunId);

      const runId = generateRunId();
      const outputDir = path.join(config.outDir, "pipe-3", runId);

      const session = sessionManager.createSession({
        runId,
        phase1RunId,
        phase1Dir,
        phase2RunId,
        phase2Dir,
        outputDir,
      });

      res.json({
        runId,
        status: session.status,
        createdAt: session.createdAt,
      });

      // ── Async pipeline: load inputs → generate subtasks → generate prompts ──
      (async () => {
        try {
          // 1. Load inputs
          sessionManager.updateStatus(runId, "loading_inputs");
          console.log(`  [run] Loading inputs for ${runId}...`);

          const p1 = loadPhase1(phase1Dir);
          const p2 = loadPhase2(phase2Dir);

          if (p1.warnings.length > 0) {
            console.log(`  [run] Phase-1 warnings: ${p1.warnings.join(", ")}`);
          }
          if (p2.warnings.length > 0) {
            console.log(`  [run] Phase-2 warnings: ${p2.warnings.join(", ")}`);
          }

          sessionManager.setLoadedData(
            runId,
            p1.summary,
            p2.summary,
            p2.impact,
            p2.prdText,
          );

          // 2. Generate subtasks
          sessionManager.updateStatus(runId, "generating_subtasks");
          console.log(`  [run] Generating subtasks for ${runId}...`);

          const engine = new OpenAIEngine(config.openaiApiKey);
          const subtasks = await engine.generateSubtasks(
            p1.summary,
            p2.summary,
            p2.impact,
            p2.prdText,
          );

          sessionManager.setSubtasks(runId, subtasks);

          // 3. Generate prompts
          sessionManager.updateStatus(runId, "generating_prompts");
          console.log(`  [run] Generating agent prompts for ${runId}...`);

          const promptPack = await engine.generatePrompts(
            subtasks,
            p1.summary,
            p2.prdText,
          );

          // 4. Build roadmap
          const roadmap = engine.buildRoadmap(
            subtasks,
            p2.impact.prd.hash,
            p2.impact.prd.source,
          );

          sessionManager.setRoadmapAndPrompts(runId, roadmap, promptPack);

          // 5. Write output files
          const updatedSession = sessionManager.getSession(runId)!;
          writeSessionOutput(updatedSession);
          sessionManager.markOutputWritten(runId);

          sessionManager.updateStatus(runId, "complete");
          console.log(`  [run] Run ${runId} complete!`);
        } catch (err) {
          console.error(`  [run] Run ${runId} failed:`, (err as Error).message);
          sessionManager.updateStatus(
            runId,
            "error",
            `Pipeline failed: ${(err as Error).message}`,
          );
        }
      })();
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/runs/:runId/status
 * Lightweight status polling endpoint.
 */
runsRouter.get(
  "/:runId/status",
  (req: Request<{ runId: string }>, res: Response, next: NextFunction) => {
    try {
      const session = sessionManager.getSession(req.params.runId);
      if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

      res.json({
        runId: session.runId,
        status: session.status,
        error: session.error,
        subtaskCount: session.subtasks?.length ?? 0,
        promptCount: session.promptPack?.prompts.length ?? 0,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/runs/:runId/impact
 * Return the loaded impact analysis data.
 */
runsRouter.get(
  "/:runId/impact",
  (req: Request<{ runId: string }>, res: Response, next: NextFunction) => {
    try {
      const session = sessionManager.getSession(req.params.runId);
      if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

      if (!session.impact) {
        res.json({ status: "pending" });
        return;
      }

      res.json({ status: "loaded", impact: session.impact });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/runs/:runId/copilot-instructions
 * Return the copilot-instructions.md content and system-prompts.json from pipe-1.
 */
runsRouter.get(
  "/:runId/copilot-instructions",
  (req: Request<{ runId: string }>, res: Response, next: NextFunction) => {
    try {
      const session = sessionManager.getSession(req.params.runId);
      if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

      if (!session.phase1Summary) {
        res.json({ status: "pending" });
        return;
      }

      res.json({
        status: "loaded",
        copilotInstructions: session.phase1Summary.copilotInstructions,
        systemPrompts: session.phase1Summary.systemPrompts,
      });
    } catch (err) {
      next(err);
    }
  },
);
