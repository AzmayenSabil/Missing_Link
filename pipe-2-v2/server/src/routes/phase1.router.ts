/**
 * phase1.router.ts – Endpoints for discovering available pipe-1 runs.
 */

import { Router, NextFunction, Request, Response } from "express";
import {
  listPhase1Runs,
  loadProjectDNA,
} from "../services/phase1Loader.service";
import { config } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import path from "node:path";
import fs from "node:fs";

export const phase1Router = Router();

/**
 * GET /api/phase1/runs
 * List all available pipe-1 run directories.
 */
phase1Router.get(
  "/runs",
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      const runs = listPhase1Runs(config.outDir);
      res.json({ runs });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/phase1/runs/:runId/summary
 * Return manifest + file count for a specific pipe-1 run.
 */
phase1Router.get(
  "/runs/:runId/summary",
  (req: Request<{ runId: string }>, res: Response, next: NextFunction) => {
    try {
      const runId = req.params.runId;
      const runPath = path.join(config.outDir, "pipe-1", runId);

      if (!fs.existsSync(runPath)) {
        throw new AppError(
          "PHASE1_NOT_FOUND",
          `Pipe-1 run not found: ${runId}`,
          404,
        );
      }

      const dna = loadProjectDNA(runPath);

      const structure = dna.structure as Record<string, unknown>;
      const filesCount = (structure.totalFiles as number) ?? 0;

      res.json({
        manifest: dna.manifest,
        structure: dna.structure,
        filesCount,
      });
    } catch (err) {
      next(err);
    }
  },
);
