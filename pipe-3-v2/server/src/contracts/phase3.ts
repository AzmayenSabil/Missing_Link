/**
 * Phase 3 v2 – Contracts for subtask generation and agent prompt packs.
 * Based on pipe-3/src/contracts/phase3.ts with durationHours extension.
 */

// ---------------------------------------------------------------------------
// Impact area (shared with phase-2)
// ---------------------------------------------------------------------------

export type ImpactArea =
  | "UI"
  | "Hooks"
  | "State"
  | "API/Service"
  | "Auth"
  | "Routing"
  | "Styling"
  | "Types"
  | "Tests"
  | "Build/Config"
  | "Unknown";

// ---------------------------------------------------------------------------
// Plan step kinds
// ---------------------------------------------------------------------------

export type StepKind =
  | "create"
  | "modify"
  | "refactor"
  | "config"
  | "test"
  | "docs";

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

export interface FeatureDependency {
  kind: string;
  target?: string;
  name?: string;
  status: "existing" | "missing" | "unknown";
  why: string[];
}

export interface VerificationItem {
  type: "lint" | "typecheck" | "unit_test" | "integration_test" | "manual";
  instructions: string[];
}

export interface RiskItem {
  severity: "low" | "medium" | "high";
  risk: string;
  mitigation: string[];
}

export interface QuestionRef {
  id: string;
  question: string;
  blocking: boolean;
  whyThisMatters: string[];
}

// ---------------------------------------------------------------------------
// Plan Step (extended with duration)
// ---------------------------------------------------------------------------

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
  /** Estimated duration in hours */
  durationHours: number;
}

// ---------------------------------------------------------------------------
// Roadmap
// ---------------------------------------------------------------------------

export interface Roadmap {
  prd: {
    hash: string;
    source?: string;
  };
  generatedAt: string;
  plan: PlanStep[];
  artifacts: {
    filesToModify: string[];
    filesAffected: string[];
    filesToCreate: string[];
    dependencies: FeatureDependency[];
  };
  acceptanceCriteria: string[];
  verification: VerificationItem[];
  risks: RiskItem[];
  openQuestions: QuestionRef[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Agent Prompt Pack
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

export interface AgentPromptPack {
  generatedAt: string;
  prompts: AgentPrompt[];
}

// ---------------------------------------------------------------------------
// Phase-1 & Phase-2 summaries (input data)
// ---------------------------------------------------------------------------

export interface Phase1Summary {
  allFiles: string[];
  conventions: Record<string, unknown>;
  rules: Record<string, unknown>;
  tokens: Record<string, unknown>;
  projectDna: unknown[];
  /** Raw markdown text of project-dna/copilot-instructions.md */
  copilotInstructions: string;
  /** Parsed content of project-dna/system-prompts.json */
  systemPrompts: Record<string, unknown>;
}

export interface ImpactFile {
  path: string;
  score: number;
  role: string;
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

export interface ClarifyingAnswer {
  questionId: string;
  value: string | string[];
}

export interface ClarifyingQuestion {
  id: string;
  questionText: string;
  type: string;
  required: boolean;
  options?: string[];
  rationale?: string;
}

export interface Phase2Summary {
  prdHash: string;
  prdSource?: string;
  impactedFiles: ImpactFile[];
  areaSummaries: AreaSummary[];
  questions: ClarifyingQuestion[];
  answers: ClarifyingAnswer[];
  newFilesSuggested: string[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Run status & metadata
// ---------------------------------------------------------------------------

export type RunStatus =
  | "created"
  | "loading_inputs"
  | "generating_subtasks"
  | "generating_prompts"
  | "complete"
  | "error";

export interface Phase3RunMeta {
  runId: string;
  phase1OutDir: string;
  phase2OutDir: string;
  prdPath?: string;
  outDir: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: "running" | "success" | "error";
  error?: string;
  engineName: string;
}
