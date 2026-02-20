/**
 * API calls for phase-1 discovery.
 */

import apiClient from "./client";
import type { Phase1RunInfo } from "../types";

export async function fetchPhase1Runs(): Promise<Phase1RunInfo[]> {
  const { data } = await apiClient.get<{ runs: Phase1RunInfo[] }>("/phase1/runs");
  return data.runs;
}

export async function fetchPhase1Summary(runId: string): Promise<{
  manifest: Record<string, unknown>;
  structure: Record<string, unknown>;
  filesCount: number;
}> {
  const { data } = await apiClient.get(`/phase1/runs/${runId}/summary`);
  return data;
}
