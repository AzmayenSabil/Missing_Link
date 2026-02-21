import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as Registry from '../services/ProjectRegistry';
import { runPipe1 } from '../services/Pipe1Runner';
import { readPipe1Output, readGitHead } from '../services/Pipe1Reader';
import { ProjectDNA } from '../types';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/projects — list all projects
router.get('/', (_req, res) => {
  const projects = Registry.listProjects();
  res.json(projects);
});

// POST /api/projects — onboard a new project
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { repoUrl, name } = req.body as { repoUrl?: string; name?: string };

  if (!repoUrl?.trim()) {
    return next(new AppError('repoUrl is required', 400));
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(repoUrl.trim());
  } catch {
    return next(new AppError('repoUrl must be a valid URL', 400));
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return next(new AppError('repoUrl must use http or https', 400));
  }

  const meta = Registry.createProject(repoUrl.trim(), name?.trim());

  // Fire async ingestion — do not await
  runIngestion(meta.id, repoUrl.trim()).catch((err: Error) => {
    console.error(`[Ingestion] Failed for project ${meta.id}:`, err.message);
    Registry.updateProject(meta.id, {
      status: 'error',
      errorMessage: err.message,
    });
  });

  res.status(201).json(meta);
});

// GET /api/projects/:id — get project (with DNA if available)
router.get('/:id', (req, res, next) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  const dnaPath = path.join(Registry.getProjectDir(req.params.id), 'dna.json');
  let dna: ProjectDNA | null = null;
  if (fs.existsSync(dnaPath)) {
    try {
      dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8')) as ProjectDNA;
    } catch {
      // ignore corrupt DNA
    }
  }

  res.json({ ...meta, dna });
});

// GET /api/projects/:id/status — lightweight status poll
router.get('/:id/status', (req, res, next) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));
  res.json({ id: meta.id, status: meta.status, errorMessage: meta.errorMessage });
});

// GET /api/projects/:id/dna — get full DNA
router.get('/:id/dna', (req, res, next) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  const dnaPath = path.join(Registry.getProjectDir(req.params.id), 'dna.json');
  if (!fs.existsSync(dnaPath)) {
    return next(new AppError('DNA not yet generated. Wait for ingestion to complete.', 404));
  }

  try {
    const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8')) as ProjectDNA;
    res.json(dna);
  } catch {
    next(new AppError('Failed to read DNA file', 500));
  }
});

// GET /api/projects/:id/dna/:section — get a specific DNA section
router.get('/:id/dna/:section', (req, res, next) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  const dnaPath = path.join(Registry.getProjectDir(req.params.id), 'dna.json');
  if (!fs.existsSync(dnaPath)) {
    return next(new AppError('DNA not yet generated', 404));
  }

  try {
    const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8')) as ProjectDNA;
    const sectionData = (dna.sections as unknown as Record<string, unknown>)[req.params.section];
    if (sectionData === undefined) {
      return next(new AppError(`Section '${req.params.section}' not found in DNA`, 404));
    }
    res.json({ section: req.params.section, data: sectionData });
  } catch {
    next(new AppError('Failed to read DNA file', 500));
  }
});

// POST /api/projects/:id/refresh — re-ingest with pipe-1
router.post('/:id/refresh', async (req: Request, res: Response, next: NextFunction) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  if (meta.status === 'ingesting' || meta.status === 'refreshing') {
    return next(new AppError('Project is already being analyzed', 409));
  }

  Registry.updateProject(req.params.id, { status: 'refreshing', errorMessage: undefined });

  runIngestion(meta.id, meta.repoUrl).catch((err: Error) => {
    Registry.updateProject(meta.id, { status: 'error', errorMessage: err.message });
  });

  res.json({ message: 'Refresh started', id: meta.id });
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res, next) => {
  const deleted = Registry.deleteProject(req.params.id);
  if (!deleted) return next(new AppError('Project not found', 404));
  res.json({ message: 'Project deleted successfully' });
});

// POST /api/projects/:id/evolve — notify of a PR merge; re-read pipe-1 output
// (Pipe-1 doesn't have an evolve mode; refresh the project to re-run the full pipeline)
router.post('/:id/evolve', async (req: Request, res: Response, next: NextFunction) => {
  const meta = Registry.getProject(req.params.id);
  if (!meta) return next(new AppError('Project not found', 404));

  const { prSummary } = req.body as { prSummary?: string; changedFiles?: string[] };
  if (!prSummary?.trim()) {
    return next(new AppError('prSummary is required', 400));
  }

  const dnaPath = path.join(Registry.getProjectDir(req.params.id), 'dna.json');
  if (!fs.existsSync(dnaPath)) {
    return next(new AppError('DNA not yet generated. Ingest the project first.', 404));
  }

  // Re-ingest the project to pick up changes from the merged PR
  if (meta.status === 'ingesting' || meta.status === 'refreshing') {
    return next(new AppError('Project is already being analyzed', 409));
  }

  Registry.updateProject(req.params.id, { status: 'refreshing', errorMessage: undefined });
  runIngestion(meta.id, meta.repoUrl).catch((err: Error) => {
    Registry.updateProject(meta.id, { status: 'error', errorMessage: err.message });
  });

  res.json({
    message: `Evolution triggered for PR: "${prSummary.trim()}". Re-ingesting the repository.`,
    id: meta.id,
    status: 'refreshing',
  });
});

// ──────────────────────────────────────────────────
// Internal: full async ingestion pipeline via pipe-1
// ──────────────────────────────────────────────────
async function runIngestion(projectId: string, repoUrl: string): Promise<void> {
  Registry.updateProject(projectId, { status: 'ingesting', errorMessage: undefined });

  // 1. Spawn pipe-1 CLI — runs all 15 stages, outputs to out/pipe-1/<projectId>/
  console.log(`[Ingestion] Running pipe-1 for project ${projectId} → ${repoUrl}`);
  const { projectOutDir } = await runPipe1(projectId, repoUrl);
  console.log(`[Ingestion] pipe-1 complete. Output: ${projectOutDir}`);

  // 2. Read pipe-1 output files and map to DNASections
  const dnaDir = Registry.getDNADir(projectId);
  const dna = readPipe1Output(projectId, dnaDir, repoUrl);

  // 3. Save mapped dna.json inside the project output directory (out/pipe-1/<id>/dna.json)
  const projectDir = Registry.getProjectDir(projectId);
  fs.mkdirSync(projectDir, { recursive: true });
  const dnaPath = path.join(projectDir, 'dna.json');
  fs.writeFileSync(dnaPath, JSON.stringify(dna, null, 2));

  // 4. Extract gitHead from manifest.json
  const gitHead = readGitHead(dnaDir);

  console.log(`[Ingestion] ✓ Project ${projectId} is ready`);
  console.log(`[Ingestion]   DNA sections stored → ${dnaPath}`);

  // 5. Mark project as ready
  Registry.updateProject(projectId, {
    status: 'ready',
    scannedAt: new Date().toISOString(),
    gitHead,
    description: dna.sections.overview?.description || undefined,
  });
}

export default router;
