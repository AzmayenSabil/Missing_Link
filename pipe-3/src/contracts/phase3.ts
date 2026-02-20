/**
 * Phase 3 – Grounded Architect contracts
 * All public types shared between the pipeline, planning engines, and CLI output.
 */

// ---------------------------------------------------------------------------
// Re-export impact area from phase-2 for convenience
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
  /** Category of dependency: "npm_package", "env_var", "service", "file", etc. */
  kind: string;
  /** Optional target identifier (package name, file path, service URL) */
  target?: string;
  /** Human-readable name */
  name?: string;
  /** Whether the dependency is already in the repo or needs to be added */
  status: "existing" | "missing" | "unknown";
  /** Reasons this dependency is required */
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
  /** Original question id from phase-2 clarifying questions */
  id: string;
  question: string;
  /** If true, this question MUST be answered before implementation can start */
  blocking: boolean;
  /** Why answering this question matters for implementation */
  whyThisMatters: string[];
}

// ---------------------------------------------------------------------------
// Plan Step
// ---------------------------------------------------------------------------

export interface PlanStep {
  /** Unique stable identifier, e.g. "step-types-1" */
  id: string;
  title: string;
  description: string;
  area: ImpactArea;
  kind: StepKind;
  files: {
    /** Files to modify (must exist in repo DNA or be in filesToCreate) */
    modify: string[];
    /** New files to create */
    create: string[];
    /** Blast-radius / related files to be aware of but not necessarily changed */
    touch: string[];
  };
  /** IDs of PlanSteps that must be completed before this one */
  dependsOnStepIds: string[];
  /** Grounded reasons why this step is needed */
  rationale: string[];
  /** Very concrete checklist items telling the agent exactly what to do */
  implementationChecklist: string[];
  /** Observable conditions that confirm this step is complete */
  doneWhen: string[];
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
  /** Stable system instructions for the coding agent */
  system: string;
  context: {
    prdSummary: string;
    impactedFiles: string[];
    /** Repo conventions extracted from phase-1 project-dna/conventions.json */
    relevantRepoConventions: string[];
    /** Token/CSS variable constraints from phase-1 tokens.json / rules.json */
    tokensOrConstraints: string[];
    /** Short evidence bullets grounding this step in actual repo artifacts */
    evidence: string[];
  };
  /** Explicit ordered tasks for the coding agent */
  instructions: string[];
  /** Do / don't rules to constrain the agent's output */
  guardrails: string[];
  /** Expected deliverables: patches, files, tests */
  deliverables: string[];
}

export interface AgentPromptPack {
  generatedAt: string;
  prompts: AgentPrompt[];
}

// ---------------------------------------------------------------------------
// Planning Engine interface
// ---------------------------------------------------------------------------

export interface Phase1Summary {
  /** All repo-relative file paths discovered in phase-1 */
  allFiles: string[];
  /** Contents of conventions.json if present */
  conventions: Record<string, unknown>;
  /** Contents of rules.json if present */
  rules: Record<string, unknown>;
  /** Contents of tokens.json if present */
  tokens: Record<string, unknown>;
  /** Raw project-dna entries if present (array of any shape) */
  projectDna: unknown[];
}

export interface Phase2Summary {
  /** SHA-256 of the PRD */
  prdHash: string;
  /** Original PRD source path */
  prdSource?: string;
  /** All files in the impact analysis */
  impactedFiles: Array<{
    path: string;
    score: number;
    role: string;
    reasons: string[];
  }>;
  /** Impacted area summaries */
  areaSummaries: Array<{ area: ImpactArea; confidence: number; rationale: string[] }>;
  /** Raw clarifying questions from phase-2 */
  questions: Array<{
    id: string;
    questionText: string;
    type: string;
    required: boolean;
    options?: string[];
    rationale?: string;
  }>;
  /** Suggested new file paths from the impact analysis notes */
  newFilesSuggested: string[];
  /** Notes from phase-2 */
  notes: string[];
}

export interface PlanningInput {
  phase1: Phase1Summary;
  phase2: Phase2Summary;
  /** Optional raw PRD text (re-read if available) */
  prdText?: string;
}

export interface PlanningOutput {
  roadmap: Roadmap;
  promptPack: AgentPromptPack;
  engineNotes: string[];
}

export interface PlanningEngine {
  readonly name: string;
  plan(input: PlanningInput): Promise<PlanningOutput>;
}

// ---------------------------------------------------------------------------
// CLI / Run metadata
// ---------------------------------------------------------------------------

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
