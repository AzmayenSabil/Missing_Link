import client from './client';
import type { ProjectMeta, ProjectWithDNA, ProjectDNA, QueryResult } from '../types';

export const projectsApi = {
  list: (): Promise<ProjectMeta[]> =>
    client.get('/projects').then((r) => r.data),

  get: (id: string): Promise<ProjectWithDNA> =>
    client.get(`/projects/${id}`).then((r) => r.data),

  onboard: (repoUrl: string, name?: string): Promise<ProjectMeta> =>
    client.post('/projects', { repoUrl, name }).then((r) => r.data),

  getStatus: (id: string): Promise<{ id: string; status: string; errorMessage?: string }> =>
    client.get(`/projects/${id}/status`).then((r) => r.data),

  getDNA: (id: string): Promise<ProjectDNA> =>
    client.get(`/projects/${id}/dna`).then((r) => r.data),

  refresh: (id: string): Promise<{ message: string; id: string }> =>
    client.post(`/projects/${id}/refresh`).then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    client.delete(`/projects/${id}`).then((r) => r.data),

  evolve: (
    id: string,
    prSummary: string,
    changedFiles: string[],
  ): Promise<{ updatedDNA: ProjectDNA; changelog: string[] }> =>
    client.post(`/projects/${id}/evolve`, { prSummary, changedFiles }).then((r) => r.data),

  query: (id: string, question: string): Promise<QueryResult> =>
    client.post(`/projects/${id}/query`, { question }).then((r) => r.data),

  getQueries: (id: string): Promise<QueryResult[]> =>
    client.get(`/projects/${id}/queries`).then((r) => r.data),
};
