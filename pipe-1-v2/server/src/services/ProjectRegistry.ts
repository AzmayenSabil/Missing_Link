import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ProjectMeta } from '../types';

// Registry lives at out/pipe-1/registry.json (same directory as project output)
const REGISTRY_PATH = path.join(env.PIPE1_OUT_DIR, 'registry.json');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readRegistry(): ProjectMeta[] {
  ensureDir(env.PIPE1_OUT_DIR);
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8')) as ProjectMeta[];
  } catch {
    return [];
  }
}

function writeRegistry(projects: ProjectMeta[]): void {
  ensureDir(env.PIPE1_OUT_DIR);
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(projects, null, 2));
}

export function listProjects(): ProjectMeta[] {
  return readRegistry();
}

export function getProject(id: string): ProjectMeta | null {
  return readRegistry().find((p) => p.id === id) ?? null;
}

export function createProject(repoUrl: string, name?: string): ProjectMeta {
  const id = uuidv4();
  const meta: ProjectMeta = {
    id,
    name: name || extractRepoName(repoUrl),
    repoUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const projects = readRegistry();
  projects.unshift(meta);
  writeRegistry(projects);
  return meta;
}

export function updateProject(id: string, partial: Partial<ProjectMeta>): ProjectMeta | null {
  const projects = readRegistry();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...partial };
  writeRegistry(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = readRegistry();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return false;

  projects.splice(idx, 1);
  writeRegistry(projects);

  // Remove the project output directory from out/pipe-1/<id>/
  const projectDir = getProjectDir(id);
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
  return true;
}

/** Root output directory for a project: out/pipe-1/<id>/ */
export function getProjectDir(id: string): string {
  return path.join(env.PIPE1_OUT_DIR, id);
}

/** DNA directory produced by pipe-1: out/pipe-1/<id>/project-dna/ */
export function getDNADir(id: string): string {
  return path.join(getProjectDir(id), 'project-dna');
}

/** Queries history file: out/pipe-1/<id>/queries.json */
export function getQueriesPath(id: string): string {
  return path.join(getProjectDir(id), 'queries.json');
}

function extractRepoName(url: string): string {
  const cleaned = url.replace(/\/$/, '').replace(/\.git$/, '');
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || 'unnamed-project';
}
