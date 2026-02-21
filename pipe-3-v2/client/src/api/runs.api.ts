/**
 * API calls for run management, subtasks, and prompts.
 */

import apiClient from "./client";
import type {
  RunStatusResponse,
  ImpactAnalysis,
  PlanStep,
  AgentPrompt,
} from "../types";

export async function createRun(params: {
  phase1RunId: string;
  phase2RunId: string;
}): Promise<{ runId: string; status: string; createdAt: string }> {
  const res = await apiClient.post("/runs", params);
  return res.data;
}

export async function fetchRunStatus(
  runId: string,
): Promise<RunStatusResponse> {
  const res = await apiClient.get(`/runs/${runId}/status`);
  return res.data;
}

export async function fetchImpact(
  runId: string,
): Promise<{ status: string; impact?: ImpactAnalysis }> {
  const res = await apiClient.get(`/runs/${runId}/impact`);
  return res.data;
}

export async function fetchSubtasks(runId: string): Promise<{
  status: string;
  subtasks: PlanStep[];
  totalCount: number;
  totalDurationHours: number;
}> {
  const res = await apiClient.get(`/runs/${runId}/subtasks`);
  return res.data;
}

export async function fetchPrompts(runId: string): Promise<{
  status: string;
  prompts: AgentPrompt[];
  totalCount: number;
  generatedAt?: string;
}> {
  const res = await apiClient.get(`/runs/${runId}/subtasks/prompts`);
  return res.data;
}

export async function fetchSinglePrompt(
  runId: string,
  stepId: string,
): Promise<{ prompt: AgentPrompt }> {
  const res = await apiClient.get(`/runs/${runId}/subtasks/prompts/${stepId}`);
  return res.data;
}

export async function fetchCopilotInstructions(runId: string): Promise<{
  status: string;
  copilotInstructions?: string;
  systemPrompts?: Record<string, unknown>;
}> {
  const res = await apiClient.get(`/runs/${runId}/copilot-instructions`);
  return res.data;
}
