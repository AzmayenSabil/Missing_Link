/**
 * inputs.router.ts – Endpoints for discovering available pipe-1 + pipe-2 runs.
 */

import { Router } from "express";
import type { Response } from "express";
import { listAvailableRuns } from "../services/inputLoader.service";

export const inputsRouter = Router();

/**
 * GET /api/inputs/runs
 * List available pipe-1 + pipe-2 run pairs.
 */
inputsRouter.get("/runs", (_req, res: Response) => {
  const pairs = listAvailableRuns();
  res.json({ runs: pairs });
});
