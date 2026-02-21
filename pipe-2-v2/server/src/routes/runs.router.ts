/**
 * runs.router.ts – Endpoints for creating and querying run sessions.
 */

import { Router, Request, Response, NextFunction } from "express";
import path from "node:path";
import { config } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { sessionManager } from "../services/sessionManager.service";
import { loadPhase1, loadProjectDNA } from "../services/phase1Loader.service";
import { processPrd } from "../services/prdReader.service";
import { buildCodebaseContext } from "../ai/prompts/contextBuilder";
import { OpenAIEngine } from "../ai/OpenAIEngine";

export const runsRouter = Router();

/**
 * POST /api/runs
 * Create a new pipe-2 session.
 * Body: { phase1RunId: string, prdText: string, prdFileName: string }
 */
runsRouter.post("/", async (req, res, next) => {
  try {
    const { phase1RunId, prdText, prdFileName } = req.body;

    if (!phase1RunId)
      throw new AppError("INVALID_INPUT", "phase1RunId is required", 400);
    if (
      !prdText ||
      typeof prdText !== "string" ||
      prdText.trim().length === 0
    ) {
      throw new AppError(
        "PRD_EMPTY",
        "PRD text is required and cannot be empty",
        400,
      );
    }

    const phase1Dir = path.join(config.outDir, "pipe-1", phase1RunId);

    // Load pipe-1 data
    const { indexes, warnings } = await loadPhase1(phase1Dir);
    if (warnings.length > 0) {
      console.log(`  [runs] Phase-1 warnings: ${warnings.join("; ")}`);
    }

    // Process PRD
    const prd = processPrd(prdText, prdFileName || "uploaded.md");

    // Load project DNA for context building
    const dna = loadProjectDNA(phase1Dir);

    // Build codebase context
    const codebaseContext = buildCodebaseContext(dna, indexes);

    // Create session
    const outRootDir = path.join(config.outDir, "pipe-2");
    const session = sessionManager.createSession({
      phase1RunId,
      phase1Dir,
      prdText: prd.normalizedText,
      prdFileName: prdFileName || "uploaded.md",
      prdMeta: prd.meta,
      codebaseContext,
      indexes,
      allFilePaths: indexes.allFiles,
      outRootDir,
    });

    // Respond immediately, then generate questions async
    res.status(201).json({
      runId: session.runId,
      status: session.status,
      createdAt: session.createdAt,
    });

    // Async: generate questions
    sessionManager.updateStatus(session.runId, "generating_questions");

    try {
      const engine = new OpenAIEngine(config.openaiApiKey);
      const questions = await engine.generateQuestions(
        prd.normalizedText,
        dna,
        indexes,
      );

      sessionManager.setQuestions(session.runId, questions);
      sessionManager.updateStatus(session.runId, "asking_questions");
      console.log(`  [runs] Questions ready for run ${session.runId}`);
    } catch (err) {
      const error = err as Error & { cause?: unknown; status?: number };
      console.error(`  [runs] Question generation failed:`, error.message);
      if (error.cause) console.error(`  [runs] Caused by:`, error.cause);
      if (error.status) console.error(`  [runs] HTTP status:`, error.status);
      sessionManager.updateStatus(
        session.runId,
        "error",
        `Question generation failed: ${error.message}`,
      );
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/runs/:runId
 * Return full session state.
 */
runsRouter.get("/:runId", (req, res, next) => {
  try {
    const session = sessionManager.getSession(req.params.runId);
    if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

    res.json({
      runId: session.runId,
      status: session.status,
      phase1RunId: session.phase1RunId,
      prdFileName: session.prdFileName,
      createdAt: session.createdAt,
      error: session.error,
      questionsCount: session.questions.length,
      answersCount: session.answers.length,
      currentQuestionIndex: session.currentQuestionIndex,
      outputWritten: session.outputWritten,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/runs/:runId/status
 * Lightweight status poll.
 */
runsRouter.get("/:runId/status", (req, res, next) => {
  try {
    const session = sessionManager.getSession(req.params.runId);
    if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

    res.json({
      runId: session.runId,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      error: session.error,
    });
  } catch (err) {
    next(err);
  }
});
