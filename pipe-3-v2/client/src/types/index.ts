// ---------------------------------------------------------------------------
// Impact Analysis types (from pipe-2 output)
// ---------------------------------------------------------------------------

export type ImpactArea =
  | "UI" | "Hooks" | "State" | "API/Service" | "Auth"
  | "Routing" | "Styling" | "Types" | "Tests" | "Build/Config" | "Unknown";

export interface ImpactFile {
  path: string;
  score: number;
  role: "primary" | "secondary" | "dependency" | "dependent";
  reasons: string[];
  evidence?: {
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
  prd: { hash: string; source?: string };
  generatedAt: string;
  summary: {
    primaryCount: number;
    secondaryCount: number;
    areas: AreaSummary[];
  };
  files: ImpactFile[];
  graphExpansion?: { hops: number; maxFiles: number };
  notes: string[];
}

// ---------------------------------------------------------------------------
// Plan Step types (subtasks)
// ---------------------------------------------------------------------------

export type StepKind = "create" | "modify" | "refactor" | "config" | "test" | "docs";

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  area: ImpactArea;
  kind: StepKind;
  files: {
    modify: string[];
    create: string[];
    touch: string[];
  };
  dependsOnStepIds: string[];
  rationale: string[];
  implementationChecklist: string[];
  doneWhen: string[];
  durationHours: number;
}

// ---------------------------------------------------------------------------
// Agent Prompt types
// ---------------------------------------------------------------------------

export interface AgentPrompt {
  stepId: string;
  title: string;
  system: string;
  context: {
    prdSummary: string;
    impactedFiles: string[];
    relevantRepoConventions: string[];
    tokensOrConstraints: string[];
    evidence: string[];
  };
  instructions: string[];
  guardrails: string[];
  deliverables: string[];
}

// ---------------------------------------------------------------------------
// Run & Input types
// ---------------------------------------------------------------------------

export type RunStatus =
  | "created"
  | "loading_inputs"
  | "generating_subtasks"
  | "generating_prompts"
  | "complete"
  | "error";

export interface RunPair {
  phase1RunId: string;
  phase1Path: string;
  phase2RunId: string;
  phase2Path: string;
  projectId?: string;
  scannedAt?: string;
}

export interface RunStatusResponse {
  runId: string;
  status: RunStatus;
  error?: string;
  subtaskCount: number;
  promptCount: number;
}
