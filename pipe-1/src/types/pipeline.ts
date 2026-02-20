export interface CliPhase1Options {
  repoPath?: string;
  gitUrl?: string;
  outDir?: string;
  projectId?: string;
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
  tokens_count: number;
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
}
