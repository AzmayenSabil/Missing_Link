import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as Registry from '../services/ProjectRegistry';
import { queryDNA, getQueryHistory } from '../services/QueryEngine';
import { AppError } from '../middleware/errorHandler';
import { ProjectDNA } from '../types';

const router = Router();

// POST /api/projects/:id/query — natural-language Q&A
router.post('/:id/query', async (req: Request, res: Response, next: NextFunction) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  if (meta.status !== 'ready') {
    return next(
      new AppError(
        `Project DNA is not ready (status: ${meta.status}). Wait for ingestion to complete.`,
        409,
      ),
    );
  }

  const { question } = req.body as { question?: string };
  if (!question?.trim()) {
    return next(new AppError('question is required', 400));
  }

  const dnaPath = path.join(Registry.getProjectDir(req.params.id), 'dna.json');
  if (!fs.existsSync(dnaPath)) {
    return next(new AppError('DNA file not found', 404));
  }

  try {
    const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8')) as ProjectDNA;
    const result = await queryDNA(req.params.id, question.trim(), dna);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/queries — fetch Q&A history
router.get('/:id/queries', (req, res, next) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  const history = getQueryHistory(req.params.id);
  res.json(history);
});

export default router;
