/**
 * questions.router.ts – Endpoints for the clarifying Q&A flow.
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { sessionManager } from "../services/sessionManager.service";
import { loadProjectDNA } from "../services/phase1Loader.service";
import { OpenAIEngine } from "../ai/OpenAIEngine";
import { writeSessionOutput } from "../services/outputWriter.service";

export const questionsRouter = Router({ mergeParams: true });

/**
 * GET /api/runs/:runId/questions
 * Return all questions and progress.
 */
questionsRouter.get(
  "/",
  (req: Request<{ runId: string }>, res: Response, next: NextFunction) => {
    try {
      const session = sessionManager.getSession(req.params.runId);
      if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

      const allAnswered =
        session.currentQuestionIndex >= session.questions.length &&
        session.questions.length > 0;

      res.json({
        questions: session.questions,
        currentIndex: session.currentQuestionIndex,
        totalCount: session.questions.length,
        allAnswered,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/runs/:runId/questions/current
 * Return only the current unanswered question.
 */
questionsRouter.get(
  "/current",
  (req: Request<{ runId: string }>, res: Response, next: NextFunction) => {
    try {
      const session = sessionManager.getSession(req.params.runId);
      if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

      if (session.questions.length === 0) {
        throw new AppError(
          "NO_QUESTIONS",
          "Questions have not been generated yet",
          400,
        );
      }

      const idx = session.currentQuestionIndex;
      if (idx >= session.questions.length) {
        res.json({ allAnswered: true });
        return;
      }

      res.json({
        question: session.questions[idx],
        index: idx,
        isLast: idx === session.questions.length - 1,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/runs/:runId/questions/:questionId/answer
 * Submit an answer for a specific question.
 */
questionsRouter.post(
  "/:questionId/answer",
  async (
    req: Request<{ runId: string; questionId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { runId, questionId } = req.params;
      const { value } = req.body;

      const session = sessionManager.getSession(runId);
      if (!session) throw new AppError("RUN_NOT_FOUND", "Run not found", 404);

      // Find the question
      const question = session.questions.find((q) => q.id === questionId);
      if (!question) {
        throw new AppError(
          "QUESTION_NOT_FOUND",
          `Question not found: ${questionId}`,
          404,
        );
      }

      // Validate value
      if (value === undefined || value === null) {
        throw new AppError("INVALID_ANSWER", "Answer value is required", 400);
      }

      // Store answer
      sessionManager.addAnswer(runId, {
        questionId,
        value,
      });

      const idx = session.currentQuestionIndex;
      const allAnswered = idx >= session.questions.length;

      if (allAnswered) {
        // All questions answered — trigger impact analysis
        res.json({ accepted: true, allAnswered: true });

        // Async: generate impact analysis
        sessionManager.updateStatus(runId, "generating_impact");

        try {
          const engine = new OpenAIEngine(config.openaiApiKey);
          const dna = loadProjectDNA(session.phase1Dir);

          // Pair questions with answers
          const qaPairs = session.questions.map((q) => {
            const a = session.answers.find((ans) => ans.questionId === q.id);
            return {
              question: q,
              answer: a ?? { questionId: q.id, value: "Not answered" },
            };
          });

          const impact = await engine.generateImpactAnalysis(
            session.prdText,
            session.prdMeta,
            dna,
            session.indexes,
            qaPairs,
          );

          sessionManager.setImpactAnalysis(runId, impact);

          // Write output files
          writeSessionOutput(session);
          sessionManager.markOutputWritten(runId);

          sessionManager.updateStatus(runId, "complete");
          console.log(
            `  [questions] Impact analysis complete for run ${runId}`,
          );
        } catch (err) {
          console.error(
            `  [questions] Impact analysis failed:`,
            (err as Error).message,
          );
          sessionManager.updateStatus(
            runId,
            "error",
            `Impact analysis failed: ${(err as Error).message}`,
          );
        }
      } else {
        // More questions remain
        const nextQ = session.questions[idx];
        res.json({
          accepted: true,
          nextQuestion: nextQ,
          allAnswered: false,
        });
      }
    } catch (err) {
      next(err);
    }
  },
);
