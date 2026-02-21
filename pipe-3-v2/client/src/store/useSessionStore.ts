/**
 * Zustand store for pipe-3-v2 session state.
 */

import { create } from "zustand";
import type {
  RunStatus,
  ImpactAnalysis,
  PlanStep,
  AgentPrompt,
} from "../types";

interface SessionState {
  // Run identity
  runId: string | null;
  phase1RunId: string;
  phase2RunId: string;
  status: RunStatus | "idle";
  error: string | null;

  // Loaded data
  impact: ImpactAnalysis | null;
  copilotInstructions: string | null;
  systemPrompts: Record<string, unknown> | null;

  // Generated data
  subtasks: PlanStep[];
  prompts: AgentPrompt[];
  totalDurationHours: number;

  // Active UI tab
  activeTab: "impact" | "subtasks" | "prompts";

  // Actions
  startRun: (runId: string, phase1RunId: string, phase2RunId: string) => void;
  setStatus: (status: RunStatus) => void;
  setError: (error: string) => void;
  setImpact: (impact: ImpactAnalysis) => void;
  setCopilotInstructions: (
    text: string,
    systemPrompts: Record<string, unknown>,
  ) => void;
  setSubtasks: (subtasks: PlanStep[], totalDurationHours: number) => void;
  setPrompts: (prompts: AgentPrompt[]) => void;
  setActiveTab: (tab: "impact" | "subtasks" | "prompts") => void;
  reset: () => void;
}

const initialState = {
  runId: null,
  phase1RunId: "",
  phase2RunId: "",
  status: "idle" as const,
  error: null,
  impact: null,
  copilotInstructions: null,
  systemPrompts: null,
  subtasks: [],
  prompts: [],
  totalDurationHours: 0,
  activeTab: "impact" as const,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  startRun: (runId, phase1RunId, phase2RunId) =>
    set({
      runId,
      phase1RunId,
      phase2RunId,
      status: "created",
      error: null,
      impact: null,
      copilotInstructions: null,
      systemPrompts: null,
      subtasks: [],
      prompts: [],
      totalDurationHours: 0,
      activeTab: "impact",
    }),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error, status: "error" }),

  setImpact: (impact) => set({ impact }),

  setCopilotInstructions: (copilotInstructions, systemPrompts) =>
    set({ copilotInstructions, systemPrompts }),

  setSubtasks: (subtasks, totalDurationHours) =>
    set({ subtasks, totalDurationHours }),

  setPrompts: (prompts) => set({ prompts }),

  setActiveTab: (activeTab) => set({ activeTab }),

  reset: () => set(initialState),
}));
