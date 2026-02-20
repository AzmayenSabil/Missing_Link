/**
 * API calls for input discovery (pipe-1 + pipe-2 runs).
 */

import apiClient from "./client";
import type { RunPair } from "../types";

export async function fetchAvailableRuns(): Promise<{ runs: RunPair[] }> {
  const res = await apiClient.get("/inputs/runs");
  return res.data;
}
