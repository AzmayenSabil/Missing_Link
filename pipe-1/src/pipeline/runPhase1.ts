import { CliPhase1Options, PipelineContext } from "../types/pipeline";
import {
  buildChunksAndSearchIndex,
  discoverStack,
  extractApiContract,
  extractStateAndHooksContracts,
  extractSymbolsAndDeps,
  extractTokensAndRules,
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
    { name: "discoverStack", run: discoverStack },
    { name: "inventoryFilesAndStructure", run: inventoryFilesAndStructure },
    { name: "extractSymbolsAndDeps", run: extractSymbolsAndDeps },
    { name: "extractApiContract", run: extractApiContract },
    {
      name: "extractStateAndHooksContracts",
      run: extractStateAndHooksContracts,
    },
    { name: "extractTokensAndRules", run: extractTokensAndRules },
    { name: "minePatternsAndExamples", run: minePatternsAndExamples },
    { name: "buildChunksAndSearchIndex", run: buildChunksAndSearchIndex },
    { name: "writeQaReport", run: writeQaReport },
  ];

  for (const stage of stages) {
    try {
      await stage.run(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
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
