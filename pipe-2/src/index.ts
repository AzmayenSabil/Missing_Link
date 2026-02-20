#!/usr/bin/env node
/**
 * index.ts – CLI entry point for Phase 2 Clarification Bridge.
 *
 * Usage:
 *   node dist/index.js --phase1Out ../out/pipe-1/<runId> \
 *                      --prd ../path/to/prd.md \
 *                      --out ../out/pipe-2
 *
 * Optional flags:
 *   --engine mock          AI engine to use (default: mock)
 *   --runId  <id>          Override the generated run ID
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "node:path";
import { runPhase2 } from "./phase2/runPhase2";
import { MockAIEngine } from "./phase2/ai/MockAIEngine";
import { AIEngine } from "./contracts/phase2";

// ---------------------------------------------------------------------------
// Engine registry – add new engines here as they are implemented
// ---------------------------------------------------------------------------
function resolveEngine(engineName: string): AIEngine {
  const name = engineName.toLowerCase();
  switch (name) {
    case "mock":
      return new MockAIEngine();
    default:
      console.warn(
        `  Unknown engine "${engineName}", falling back to MockAIEngine.`,
      );
      return new MockAIEngine();
  }
}

// ---------------------------------------------------------------------------
// CLI definition
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("clarification-bridge")
    .usage("$0 [options]")
    .option("phase1Out", {
      alias: "p1",
      type: "string",
      description: "Path to phase-1 output directory (contains indexes/)",
      demandOption: true,
    })
    .option("prd", {
      type: "string",
      description: "Path to the PRD file (.md or .txt)",
      demandOption: true,
    })
    .option("out", {
      type: "string",
      description: "Root output directory for phase-2 runs",
      default: path.join(process.cwd(), "..", "out", "pipe-2"),
    })
    .option("engine", {
      type: "string",
      description: "AI engine to use: mock | <future>",
      default: "mock",
    })
    .option("runId", {
      type: "string",
      description: "Override auto-generated run ID",
    })
    .example(
      "$0 --phase1Out ../out/pipe-1/run-123 --prd ../docs/feature.md --out ../out/pipe-2",
      "Run with mock engine using phase-1 outputs",
    )
    .help()
    .parseAsync();

  const engine = resolveEngine(argv.engine);

  await runPhase2({
    phase1OutDir: argv.phase1Out,
    prdPath: argv.prd,
    outRootDir: argv.out,
    engine,
    runId: argv.runId,
  });
}

main().catch((err: unknown) => {
  console.error("\nFatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
