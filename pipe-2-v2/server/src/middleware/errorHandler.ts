/**
 * errorHandler.ts – Global Express error handler.
 */

import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`  [error] ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // OpenAI errors
  if (err.constructor?.name === "APIError") {
    const apiErr = err as unknown as { status?: number; message: string };
    const status = apiErr.status ?? 500;
    let code = "OPENAI_ERROR";
    if (status === 401) code = "OPENAI_AUTH";
    if (status === 429) code = "OPENAI_RATE_LIMIT";

    res.status(status).json({
      error: {
        code,
        message: apiErr.message,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred",
    },
  });
}
