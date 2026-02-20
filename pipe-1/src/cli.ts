#!/usr/bin/env node
import "dotenv/config"; // loads .env into process.env before anything else runs
import path from "node:path";
import { runPhase1 } from "./pipeline/runPhase1";

interface ParsedArgs {
  command?: string;
  repo?: string;
  git?: string;
  out?: string;
  projectId?: string;
  openaiKey?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: argv[0],
  };

  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i];
    const value = argv[i + 1];

    if (token === "--repo" && value) {
      parsed.repo = value;
      i += 1;
    } else if (token === "--git" && value) {
      parsed.git = value;
      i += 1;
    } else if (token === "--out" && value) {
      parsed.out = value;
      i += 1;
    } else if (token === "--projectId" && value) {
      parsed.projectId = value;
      i += 1;
    } else if (token === "--openai-key" && value) {
      parsed.openaiKey = value;
      i += 1;
    }
  }

  return parsed;
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(
    "Usage:\n  missing-link phase1 --repo <path> [--out <dir>] [--projectId <id>] [--openai-key <key>]\n  missing-link phase1 --git <url> [--out <dir>] [--projectId <id>] [--openai-key <key>]\n\nSystem prompt generation:\n  Provide --openai-key or set the OPENAI_API_KEY environment variable to generate\n  project-dna/system-prompts.json after all static analysis stages complete.",
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command !== "phase1") {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!args.repo && !args.git) {
    // eslint-disable-next-line no-console
    console.error("Either --repo or --git must be provided.");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = await runPhase1({
    repoPath: args.repo ? path.resolve(args.repo) : undefined,
    gitUrl: args.git,
    outDir: args.out ? path.resolve(args.out) : undefined,
    projectId: args.projectId,
    openaiApiKey: args.openaiKey,
  });

  // eslint-disable-next-line no-console
  console.log(`Output directory: ${result.projectOutDir}`);
  // eslint-disable-next-line no-console
  console.log(`READY_FOR_PHASE_2: ${result.readyForPhase2}`);
  // eslint-disable-next-line no-console
  console.log(
    `Entry points => theme: ${result.entryPoints.theme ?? "n/a"}, api: ${result.entryPoints.api ?? "n/a"}, store: ${result.entryPoints.store ?? "n/a"}, authorize: ${result.entryPoints.authorize ?? "n/a"}`,
  );

  if (result.warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings.slice(0, 20)) {
      // eslint-disable-next-line no-console
      console.log(`- ${warning}`);
    }
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("missing-link phase1 failed:", error);
  process.exitCode = 1;
});
