#!/usr/bin/env node
/**
 * index.ts – CLI entry point for Phase-3 Grounded Architect.
 *
 * Usage:
 *   node dist/index.js \
 *     --phase1Out ../out/pipe-1/<runId> \
 *     --phase2Out ../out/pipe-2/<runId> \
 *     --out       ../out/pipe-3
 *
 * Optional flags:
 *   --prd     <path>   Override PRD file (default: re-read from phase2_run.json)
 *   --runId   <id>     Override run ID (default: ISO timestamp)
 *   --engine  <name>   Planning engine to use (default: mock)
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runPhase3 } from "./phase3/runPhase3";
import { MockPlanningEngine } from "./phase3/ai/MockPlanningEngine";

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("grounded-architect")
    .usage("$0 --phase1Out <dir> --phase2Out <dir> --out <dir> [options]")
    .option("phase1Out", {
      alias: "p1",
      type: "string",
      demandOption: true,
      description: "Path to the Phase-1 run output directory",
    })
    .option("phase2Out", {
      alias: "p2",
      type: "string",
      demandOption: true,
      description: "Path to the Phase-2 run output directory",
    })
    .option("out", {
      alias: "o",
      type: "string",
      demandOption: true,
      description: "Root output directory for Phase-3 runs",
    })
    .option("prd", {
      type: "string",
      description:
        "Optional: explicit path to PRD file (overrides path stored in phase2_run.json)",
    })
    .option("runId", {
      type: "string",
      description: "Optional: override the generated run ID",
    })
    .option("engine", {
      type: "string",
      default: "mock",
      choices: ["mock"] as const,
      description: "Planning engine to use",
    })
    .example(
      "$0 --phase1Out ../out/pipe-1/my-run --phase2Out ../out/pipe-2/my-run --out ../out/pipe-3",
      "Run Phase-3 using phase-1 and phase-2 outputs"
    )
    .strict()
    .help()
    .parseAsync();

  // Select engine
  const engine =
    argv.engine === "mock"
      ? new MockPlanningEngine()
      : (() => {
          throw new Error(`Unknown engine: ${argv.engine}`);
        })();

  try {
    const meta = await runPhase3({
      phase1OutDir: argv.phase1Out,
      phase2OutDir: argv.phase2Out,
      outRootDir: argv.out,
      prdPath: argv.prd,
      runId: argv.runId,
      engine,
    });

    console.log(
      `\n✔  Phase-3 complete. Status: ${meta.status}. Run ID: ${meta.runId}`
    );
    process.exit(0);
  } catch (err) {
    console.error(
      `\n✖  Phase-3 failed: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}

main();
