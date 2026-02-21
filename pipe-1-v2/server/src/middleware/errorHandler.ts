import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      return res.status(401).json({ error: 'OpenAI API key is invalid or missing.' });
    }
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
      return res
        .status(429)
        .json({ error: 'OpenAI rate limit exceeded. Please wait and try again.' });
    }
    console.error('[ErrorHandler]', err);
    return res.status(500).json({ error: msg });
  }

  console.error('[ErrorHandler] Unknown error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
}
