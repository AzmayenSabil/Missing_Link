/**
 * impact.router.ts – Endpoints for retrieving impact analysis results.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { sessionManager } from "../services/sessionManager.service";

export const impactRouter = Router({ mergeParams: true });

/**
 * GET /api/runs/:runId/impact
 * Return the impact analysis result (or status if still running).
 */
impactRouter.get("/", (req: Request<{ runId: string }>, res: Response) => {
  const session = sessionManager.getSession(req.params.runId);
  if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

  if (session.status === "generating_impact") {
    res.json({ status: "running" });
    return;
  }

  if (session.impactAnalysis) {
    res.json({ status: "complete", impact: session.impactAnalysis });
    return;
  }

  res.json({ status: "pending" });
});
