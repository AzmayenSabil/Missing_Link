/**
 * Shared types for the client – mirrors server contracts.
 */

// ---------------------------------------------------------------------------
// Phase-1
// ---------------------------------------------------------------------------

export interface Phase1RunInfo {
  id: string;
  path: string;
  projectId: string;
  scannedAt: string;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export type RunStatus =
  | "created"
  | "generating_questions"
  | "asking_questions"
  | "generating_impact"
  | "complete"
  | "error";

export interface RunStatusResponse {
  runId: string;
  status: RunStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export type QuestionType = "text" | "single_select" | "multi_select";

export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  rationale?: string;
}

// ---------------------------------------------------------------------------
// Impact
// ---------------------------------------------------------------------------

export type ImpactArea =
  | "UI" | "Hooks" | "State" | "API/Service" | "Auth"
  | "Routing" | "Styling" | "Types" | "Tests" | "Build/Config" | "Unknown";

export interface ImpactFile {
  path: string;
  score: number;
  role: "primary" | "secondary" | "dependency" | "dependent";
  reasons: string[];
  evidence: {
    matchedTerms?: string[];
    matchedSymbols?: string[];
    depDistance?: number;
  };
}

export interface AreaSummary {
  area: ImpactArea;
  confidence: number;
  rationale: string[];
}

export interface ImpactAnalysis {
  prd: { hash: string; source: string };
  generatedAt: string;
  summary: {
    primaryCount: number;
    secondaryCount: number;
    areas: AreaSummary[];
  };
  files: ImpactFile[];
  graphExpansion: { enabled: boolean; direction: string; maxDepth: number };
  notes: string[];
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  component?: "question_card" | "impact_dashboard" | "prd_preview";
  data?: unknown;
  timestamp: string;
}
