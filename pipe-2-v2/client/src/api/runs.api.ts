/**
 * API calls for runs, questions, and impact analysis.
 */

import apiClient from "./client";
import type { Question, RunStatusResponse, ImpactAnalysis } from "../types";

export async function createRun(params: {
  phase1RunId: string;
  prdText: string;
  prdFileName: string;
}): Promise<{ runId: string; status: string; createdAt: string }> {
  const { data } = await apiClient.post("/runs", params);
  return data;
}

export async function fetchRunStatus(runId: string): Promise<RunStatusResponse> {
  const { data } = await apiClient.get<RunStatusResponse>(`/runs/${runId}/status`);
  return data;
}

export async function fetchQuestions(runId: string): Promise<{
  questions: Question[];
  currentIndex: number;
  totalCount: number;
  allAnswered: boolean;
}> {
  const { data } = await apiClient.get(`/runs/${runId}/questions`);
  return data;
}

export async function fetchCurrentQuestion(runId: string): Promise<{
  question?: Question;
  index?: number;
  isLast?: boolean;
  allAnswered?: boolean;
}> {
  const { data } = await apiClient.get(`/runs/${runId}/questions/current`);
  return data;
}

export async function submitAnswer(
  runId: string,
  questionId: string,
  value: string | string[],
): Promise<{
  accepted: boolean;
  nextQuestion?: Question;
  allAnswered: boolean;
}> {
  const { data } = await apiClient.post(
    `/runs/${runId}/questions/${questionId}/answer`,
    { value },
  );
  return data;
}

export async function fetchImpactAnalysis(runId: string): Promise<{
  status: "pending" | "running" | "complete";
  impact?: ImpactAnalysis;
}> {
  const { data } = await apiClient.get(`/runs/${runId}/impact`);
  return data;
}
