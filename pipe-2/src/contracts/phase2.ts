/**
 * Phase 2 – Clarification Bridge contracts
 * All public types shared between the pipeline, AI engines, and CLI output.
 */

// ---------------------------------------------------------------------------
// Clarifying Questions
// ---------------------------------------------------------------------------

export type QuestionType = "text" | "single_select" | "multi_select";

export interface Question {
  /** Unique stable identifier, e.g. "q-auth-1" */
  id: string;
  questionText: string;
  type: QuestionType;
  required: boolean;
  /** Options for single_select / multi_select questions */
  options?: string[];
  /** Internal rationale explaining why this question was generated */
  rationale?: string;
}

export interface Answer {
  questionId: string;
  /** For text: a string. For *_select: string | string[] */
  value: string | string[];
}

// ---------------------------------------------------------------------------
// Impact Analysis
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

export type FileRole = "primary" | "secondary" | "dependency" | "dependent";

export interface ImpactEvidence {
  /** PRD keywords or fragments that matched this file */
  matchedTerms?: string[];
  /** Symbol names found in both PRD tokens and the symbol index for this file */
  matchedSymbols?: string[];
  /** Hop distance in the dependency graph (0 = direct seed match) */
  depDistance?: number;
}

export interface ImpactFile {
  /** Relative path from repo root (forward-slash separated) */
  path: string;
  /** Normalised relevance score in [0, 1] */
  score: number;
  role: FileRole;
  reasons: string[];
  evidence: ImpactEvidence;
}

export interface AreaSummary {
  area: ImpactArea;
  /** Fraction of total weighted score belonging to this area, in [0, 1] */
  confidence: number;
  rationale: string[];
}

export interface GraphExpansionMeta {
  enabled: boolean;
  direction: "forward" | "reverse" | "both";
  maxDepth: number;
}

export interface PrdMeta {
  /** SHA-256 hex of the PRD text */
  hash: string;
  /** Original file path supplied on CLI */
  source: string;
}

export interface ImpactAnalysis {
  prd: PrdMeta;
  generatedAt: string;
  summary: {
    primaryCount: number;
    secondaryCount: number;
    areas: AreaSummary[];
  };
  files: ImpactFile[];
  graphExpansion: GraphExpansionMeta;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Phase-1 index shapes (minimal – enough to drive the mock engine)
// ---------------------------------------------------------------------------

export interface SearchIndexEntry {
  id: string;
  file: string;
  tags: string[];
  text?: string;
}

export interface SearchIndexDocument {
  /** MiniSearch serialised index – we don't need to deserialise it; we keep
   *  the raw docs array that lives next to it in the file. */
  documentCount?: number;
  /** The raw document store is written alongside the serialised index */
  _docs?: SearchIndexEntry[];
}

export type SymbolIndex = Record<
  string,
  { file: string; kind: string; tags: string[] }
>;

export interface DepGraph {
  adjacency: Record<string, string[]>;
  reverseAdjacency: Record<string, string[]>;
}

/** Aggregated phase-1 artefacts consumed by the AI engine */
export interface Phase1Indexes {
  searchDocs: SearchIndexEntry[]; // from search_index.json docs
  symbolIndex: SymbolIndex; // from symbol_index.json
  depGraph: DepGraph; // from depgraph.json
  allFiles: string[]; // list of all repo-relative file paths
}

// ---------------------------------------------------------------------------
// AI Engine interface
// ---------------------------------------------------------------------------

export interface AnalyzeInput {
  prdText: string;
  prdMeta: PrdMeta;
  indexes: Phase1Indexes;
}

export interface AnalyzeOutput {
  questions: Question[];
  impact: ImpactAnalysis;
  conflicts?: string[];
  notes?: string[];
}

export interface AIEngine {
  /** Fully analyse a PRD against phase-1 indexes and return structured output */
  analyze(input: AnalyzeInput): Promise<AnalyzeOutput>;
}

// ---------------------------------------------------------------------------
// CLI / Run metadata
// ---------------------------------------------------------------------------

export interface Phase2RunMeta {
  runId: string;
  phase1OutDir: string;
  prdPath: string;
  outDir: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: "running" | "success" | "error";
  error?: string;
  engineName: string;
}
