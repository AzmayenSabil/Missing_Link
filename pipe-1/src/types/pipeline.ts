export interface CliPhase1Options {
  repoPath?: string;
  gitUrl?: string;
  outDir?: string;
  projectId?: string;
  /** OpenAI API key. Falls back to OPENAI_API_KEY env var. If absent, system-prompt generation is skipped. */
  openaiApiKey?: string;
}

export interface RepoFingerprint {
  scannedAt: string;
  totalFiles: number;
  tsLikeFiles: number;
  gitHead?: string;
}

export interface Manifest {
  projectId: string;
  repoPath: string;
  stack: {
    next: boolean;
    react: boolean;
    typescript: boolean;
    antd: boolean;
    emotion: boolean;
    reduxToolkit: boolean;
    swr: boolean;
    axios: boolean;
  };
  configs: {
    tsconfigPresent: boolean;
    eslintPresent: boolean;
    prettierPresent: boolean;
    commitlintPresent: boolean;
  };
  fingerprint: RepoFingerprint;
}

export interface ExportRecord {
  symbol: string;
  kind: string;
  file: string;
  tags: string[];
  startLine?: number;
  endLine?: number;
}

export interface ImportRecord {
  file: string;
  moduleSpecifier: string;
  resolvedFile?: string;
  importedSymbols: string[];
}

export interface ChunkRecord {
  chunk_id: string;
  file: string;
  tags: string[];
  text: string;
}

export interface PipelineMetrics {
  files_scanned: number;
  ts_files_parsed: number;
  exports_count: number;
  imports_edges_count: number;
  imports_resolved_count: number;
  tokens_count: number;
}

// ─── New artifact interfaces ──────────────────────────────────────────────────

export interface StyleContract {
  typescript: {
    strict: boolean;
    jsx: string | null;
    baseUrl?: string;
    pathAliases?: Record<string, string[]>;
    moduleResolution?: string;
    target?: string;
  };
  eslint: {
    present: boolean;
    importantRules: Record<string, unknown>;
  };
  prettier: {
    present: boolean;
    semi: boolean;
    singleQuote: boolean;
    trailingComma: string;
    printWidth: number;
  };
}

export interface ModuleResolutionContract {
  baseUrl?: string;
  pathAliases: Record<string, string[]>;
  aliasUsageDetected: boolean;
  detectedAliasPrefixes: string[];
}

export interface NamingConventions {
  fileStyle: "kebab" | "camel" | "pascal" | "mixed";
  componentStyle: "PascalCase" | "mixed" | "unknown";
  hookPrefix: "use" | "mixed" | "unknown";
  barrelUsageRatio: number;
  testFilePattern?: "test" | "spec" | "mixed" | null;
}

export interface ArchitectureBoundaries {
  roles: string[];
  roleEdges: Record<string, string[]>;
  violationsSample: Array<{ from: string; to: string; file: string }>;
}

export interface StateStyle {
  typedHooks: {
    useAppDispatch: boolean;
    useAppSelector: boolean;
    typeFiles: string[];
  };
  directUseSelectorCount: number;
  directUseDispatchCount: number;
  storeLocation?: string;
}

export interface PipelineContext {
  input: CliPhase1Options;
  repoPath: string;
  workingRepoPath: string;
  projectId: string;
  outDir: string;
  projectOutDir: string;
  dnaDir: string;
  examplesDir: string;
  indexesDir: string;
  allFiles: string[];
  tsLikeFiles: string[];
  exports: ExportRecord[];
  imports: ImportRecord[];
  depgraph: {
    adjacency: Record<string, string[]>;
    reverseAdjacency: Record<string, string[]>;
  };
  symbolIndex: Record<string, { file: string; kind: string; tags: string[] }>;
  hookExports: ExportRecord[];
  tokens: Array<{ name: string; value: string; file: string }>;
  entryPoints: {
    theme?: string;
    api?: string;
    store?: string;
    authorize?: string;
  };
  warnings: string[];
  metrics: PipelineMetrics;
  readyForPhase2?: boolean;
  // Populated by inventoryFilesAndStructure, consumed by analyzeArchitectureBoundaries
  folderRoles: Record<string, string>;
  // Populated by extractModuleResolution, consumed by writeQaReport
  pathAliases: Record<string, string[]>;
  aliasUsageDetected: boolean;
  /** Resolved OpenAI API key (from options or env). Undefined → skip LLM stage. */
  openaiApiKey?: string;
}

// ─── System Prompts artifact ───────────────────────────────────────────────────

export interface SystemPromptEntry {
  /** Human-readable purpose label */
  purpose: string;
  /** Ready-to-use system instruction text for downstream LLM calls */
  systemPrompt: string;
}

export interface SystemPromptsOutput {
  generatedAt: string;
  model: string;
  projectId: string;
  prompts: {
    /** Use when feeding this repo's context into a PRD analysis LLM */
    prd_analysis: SystemPromptEntry;
    /** Use when planning architecture / scaffolding new features */
    architecture_planning: SystemPromptEntry;
    /** Use when generating new source files for this project */
    code_generation: SystemPromptEntry;
    /** Use when asking an LLM to create a React component for this project */
    component_creation: SystemPromptEntry;
    /** Use when generating API integration / service layer code */
    api_integration: SystemPromptEntry;
  };
}
