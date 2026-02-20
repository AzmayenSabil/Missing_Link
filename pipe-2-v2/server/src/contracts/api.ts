/**
 * api.ts – REST request/response DTOs for the pipe-2-v2 server.
 */

import type {
  Question,
  Answer,
  ImpactAnalysis,
} from "./phase2";

// ---------------------------------------------------------------------------
// Phase-1 Discovery
// ---------------------------------------------------------------------------

export interface Phase1RunInfo {
  id: string;
  path: string;
  projectId: string;
  scannedAt: string;
}

export interface Phase1RunsResponse {
  runs: Phase1RunInfo[];
}

export interface Phase1SummaryResponse {
  manifest: Record<string, unknown>;
  structure: Record<string, unknown>;
  filesCount: number;
}

// ---------------------------------------------------------------------------
// Run Management
// ---------------------------------------------------------------------------

export type RunStatus =
  | "created"
  | "generating_questions"
  | "asking_questions"
  | "generating_impact"
  | "complete"
  | "error";

export interface CreateRunRequest {
  phase1RunId: string;
  prdText: string;
  prdFileName: string;
}

export interface CreateRunResponse {
  runId: string;
  status: RunStatus;
  createdAt: string;
}

export interface RunStatusResponse {
  runId: string;
  status: RunStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Clarifying Questions
// ---------------------------------------------------------------------------

export interface QuestionsResponse {
  questions: Question[];
  currentIndex: number;
  totalCount: number;
  allAnswered: boolean;
}

export interface CurrentQuestionResponse {
  question: Question;
  index: number;
  isLast: boolean;
}

export interface AllAnsweredResponse {
  allAnswered: true;
}

export interface AnswerRequest {
  value: string | string[];
}

export interface AnswerResponse {
  accepted: true;
  nextQuestion?: Question;
  allAnswered: boolean;
}

// ---------------------------------------------------------------------------
// Impact Analysis
// ---------------------------------------------------------------------------

export interface ImpactResponse {
  status: "pending" | "running" | "complete";
  impact?: ImpactAnalysis;
}
