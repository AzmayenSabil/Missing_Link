import { CliPhase1Options, PipelineContext } from "../types/pipeline";
import {
  analyzeArchitectureBoundaries,
  buildChunksAndSearchIndex,
  discoverStack,
  extractApiContract,
  extractModuleResolution,
  extractStateAndHooksContracts,
  extractStateStyle,
  extractStyleContract,
  extractSymbolsAndDeps,
  extractTokensAndRules,
  generateSystemPrompts,
  inferNamingConventions,
  intakeRepo,
  inventoryFilesAndStructure,
  minePatternsAndExamples,
  writeQaReport,
} from "./stages";

export interface Phase1Result {
  projectOutDir: string;
  readyForPhase2: boolean;
  entryPoints: {
    theme?: string;
    api?: string;
    store?: string;
    authorize?: string;
  };
  warnings: string[];
}

export async function runPhase1(
  options: CliPhase1Options,
): Promise<Phase1Result> {
  const context = await intakeRepo(options);

  const stages: Array<{
    name: string;
    run: (ctx: PipelineContext) => Promise<void>;
  }> = [
    // ── Core discovery ───────────────────────────────────────────────────────
    { name: "discoverStack", run: discoverStack },
    { name: "inventoryFilesAndStructure", run: inventoryFilesAndStructure },
    { name: "extractSymbolsAndDeps", run: extractSymbolsAndDeps },

    // ── Config & convention contracts (depend on workingRepoPath + imports) ──
    { name: "extractStyleContract", run: extractStyleContract },
    { name: "extractModuleResolution", run: extractModuleResolution },

    // ── Domain contracts ─────────────────────────────────────────────────────
    { name: "extractApiContract", run: extractApiContract },
    {
      name: "extractStateAndHooksContracts",
      run: extractStateAndHooksContracts,
    },
    { name: "extractStateStyle", run: extractStateStyle },
    { name: "extractTokensAndRules", run: extractTokensAndRules },

    // ── Pattern & convention analysis (needs exports + folderRoles + depgraph)
    { name: "inferNamingConventions", run: inferNamingConventions },
    {
      name: "analyzeArchitectureBoundaries",
      run: analyzeArchitectureBoundaries,
    },

    // ── Chunking & indexing ──────────────────────────────────────────────────
    { name: "minePatternsAndExamples", run: minePatternsAndExamples },
    { name: "buildChunksAndSearchIndex", run: buildChunksAndSearchIndex },

    // ── QA (must be last — reads coverage data stored on ctx) ────────────────
    { name: "writeQaReport", run: writeQaReport },

    // ── LLM enrichment (optional — skipped if no API key) ────────────────────
    { name: "generateSystemPrompts", run: generateSystemPrompts },
  ];

  const total = stages.length;
  for (let i = 0; i < total; i++) {
    const stage = stages[i]!;
    console.log(`[${i + 1}/${total}] ${stage.name}...`);
    try {
      await stage.run(context);
      console.log(`[${i + 1}/${total}] ${stage.name} ✓`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${i + 1}/${total}] ${stage.name} ✗  ${message}`);
      context.warnings.push(`${stage.name} failed: ${message}`);
    }
  }

  return {
    projectOutDir: context.projectOutDir,
    readyForPhase2: Boolean(context.readyForPhase2),
    entryPoints: context.entryPoints,
    warnings: context.warnings,
  };
}
