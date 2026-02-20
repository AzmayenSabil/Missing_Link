/**
 * subtasks.router.ts – Endpoints for retrieving subtasks and agent prompts.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { sessionManager } from "../services/sessionManager.service";

export const subtasksRouter = Router({ mergeParams: true });

/**
 * GET /api/runs/:runId/subtasks
 * Return generated subtasks.
 */
subtasksRouter.get(
  "/",
  (req: Request<{ runId: string }>, res: Response) => {
    const session = sessionManager.getSession(req.params.runId);
    if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

    if (!session.subtasks) {
      res.json({ status: "pending", subtasks: [] });
      return;
    }

    const totalDuration = session.subtasks.reduce(
      (sum, s) => sum + s.durationHours,
      0,
    );

    res.json({
      status: "ready",
      subtasks: session.subtasks,
      totalCount: session.subtasks.length,
      totalDurationHours: totalDuration,
    });
  },
);

/**
 * GET /api/runs/:runId/prompts
 * Return full agent prompt pack.
 */
subtasksRouter.get(
  "/prompts",
  (req: Request<{ runId: string }>, res: Response) => {
    const session = sessionManager.getSession(req.params.runId);
    if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

    if (!session.promptPack) {
      res.json({ status: "pending", prompts: [] });
      return;
    }

    res.json({
      status: "ready",
      generatedAt: session.promptPack.generatedAt,
      prompts: session.promptPack.prompts,
      totalCount: session.promptPack.prompts.length,
    });
  },
);

/**
 * GET /api/runs/:runId/prompts/:stepId
 * Return a single agent prompt by step ID.
 */
subtasksRouter.get(
  "/prompts/:stepId",
  (req: Request<{ runId: string; stepId: string }>, res: Response) => {
    const session = sessionManager.getSession(req.params.runId);
    if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

    if (!session.promptPack) {
      throw new AppError("NOT_READY", "Prompts not yet generated", 400);
    }

    const prompt = session.promptPack.prompts.find(
      (p) => p.stepId === req.params.stepId,
    );
    if (!prompt) {
      throw new AppError(
        "PROMPT_NOT_FOUND",
        `No prompt found for step: ${req.params.stepId}`,
        404,
      );
    }

    res.json({ prompt });
  },
);
