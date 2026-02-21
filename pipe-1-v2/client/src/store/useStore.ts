import { create } from 'zustand';
import type { ProjectMeta, ProjectWithDNA, QueryResult } from '../types';
import { projectsApi } from '../api/projects.api';

interface StoreState {
  projects: ProjectMeta[];
  selectedProject: ProjectWithDNA | null;
  queryHistory: QueryResult[];
  activeSection: string;
  isLoading: boolean;
  isQuerying: boolean;
  isEvolving: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  onboardProject: (repoUrl: string, name?: string) => Promise<ProjectMeta>;
  selectProject: (id: string) => Promise<void>;
  refreshProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  pollStatus: (id: string, onDone: (status: string) => void) => ReturnType<typeof setInterval>;
  queryProject: (id: string, question: string) => Promise<QueryResult>;
  evolveProject: (
    id: string,
    prSummary: string,
    changedFiles: string[],
  ) => Promise<{ changelog: string[] }>;
  setActiveSection: (section: string) => void;
  setError: (error: string | null) => void;
  updateProjectStatus: (id: string, status: string, errorMessage?: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  projects: [],
  selectedProject: null,
  queryHistory: [],
  activeSection: 'overview',
  isLoading: false,
  isQuerying: false,
  isEvolving: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectsApi.list();
      set({ projects, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  onboardProject: async (repoUrl, name) => {
    const project = await projectsApi.onboard(repoUrl, name);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  selectProject: async (id) => {
    set({ isLoading: true, error: null, activeSection: 'overview', queryHistory: [] });
    try {
      const [project, history] = await Promise.all([
        projectsApi.get(id),
        projectsApi.getQueries(id).catch(() => [] as QueryResult[]),
      ]);
      set({ selectedProject: project, queryHistory: history, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  refreshProject: async (id) => {
    await projectsApi.refresh(id);
    get().updateProjectStatus(id, 'refreshing');
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
    }));
  },

  pollStatus: (id, onDone) => {
    const interval = setInterval(async () => {
      try {
        const { status, errorMessage } = await projectsApi.getStatus(id);
        get().updateProjectStatus(id, status, errorMessage);
        if (status === 'ready' || status === 'error') {
          clearInterval(interval);
          onDone(status);
        }
      } catch {
        // ignore transient poll errors
      }
    }, 3000);
    return interval;
  },

  queryProject: async (id, question) => {
    set({ isQuerying: true, error: null });
    try {
      const result = await projectsApi.query(id, question);
      set((state) => ({
        queryHistory: [...state.queryHistory, result],
        isQuerying: false,
      }));
      return result;
    } catch (err) {
      set({ isQuerying: false, error: (err as Error).message });
      throw err;
    }
  },

  evolveProject: async (id, prSummary, changedFiles) => {
    set({ isEvolving: true, error: null });
    try {
      const result = await projectsApi.evolve(id, prSummary, changedFiles);
      // Reload full project to get updated DNA
      await get().selectProject(id);
      set({ isEvolving: false });
      return { changelog: result.changelog };
    } catch (err) {
      set({ isEvolving: false, error: (err as Error).message });
      throw err;
    }
  },

  setActiveSection: (section) => set({ activeSection: section }),

  setError: (error) => set({ error }),

  updateProjectStatus: (id, status, errorMessage) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, status: status as ProjectMeta['status'], errorMessage }
          : p,
      ),
      selectedProject:
        state.selectedProject?.id === id
          ? { ...state.selectedProject, status: status as ProjectMeta['status'], errorMessage }
          : state.selectedProject,
    }));
  },
}));
