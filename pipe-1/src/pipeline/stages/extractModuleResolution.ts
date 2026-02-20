/**
 * extractModuleResolution
 *
 * Reads tsconfig path aliases + baseUrl, then scans ctx.imports to determine
 * whether alias-style specifiers are actually used in the codebase.
 * Produces `module-resolution.json` and stores alias data on ctx for the QA
 * coverage calculation.
 */
import path from "node:path";
import {
  ModuleResolutionContract,
  PipelineContext,
} from "../../types/pipeline";
import { readJsonIfPossible, writeJson } from "../../utils/fs";

interface TsConfigShape {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

/**
 * Derive the set of alias *prefixes* that should be treated as "alias imports"
 * when scanning module specifiers.  For example "@/*" produces the prefix "@/".
 */
function aliasPrefixes(pathAliases: Record<string, string[]>): string[] {
  const prefixes = new Set<string>();
  for (const key of Object.keys(pathAliases)) {
    // "@/*"  → "@/"
    // "~/*"  → "~/"
    // "@utils" → "@utils"
    const clean = key.replace(/\/\*$/, "/").replace(/\*$/, "");
    if (clean.length > 0) {
      prefixes.add(clean);
    }
  }
  return Array.from(prefixes).sort();
}

export async function extractModuleResolution(
  ctx: PipelineContext,
): Promise<void> {
  // ── 1. Read tsconfig ──────────────────────────────────────────────────────
  const tsconfigPath = path.join(ctx.workingRepoPath, "tsconfig.json");
  const tsconfig = await readJsonIfPossible<TsConfigShape>(tsconfigPath);
  const co = tsconfig?.compilerOptions ?? {};

  const baseUrl: string | undefined = co.baseUrl;
  const pathAliases: Record<string, string[]> = co.paths ?? {};

  // ── 2. Detect alias usage in import specifiers ───────────────────────────
  const prefixes = aliasPrefixes(pathAliases);

  // Always treat "@/" as a common conventional prefix even if not in tsconfig
  const checkPrefixes = new Set([...prefixes, "@/"]);

  let aliasUsageDetected = false;
  if (checkPrefixes.size > 0) {
    outer: for (const importRecord of ctx.imports) {
      for (const prefix of checkPrefixes) {
        if (importRecord.moduleSpecifier.startsWith(prefix)) {
          aliasUsageDetected = true;
          break outer;
        }
      }
    }
  }

  // ── 3. Persist on context for writeQaReport ───────────────────────────────
  ctx.pathAliases = pathAliases;
  ctx.aliasUsageDetected = aliasUsageDetected;

  // ── 4. Write artifact ────────────────────────────────────────────────────
  const contract: ModuleResolutionContract = {
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    pathAliases,
    aliasUsageDetected,
    detectedAliasPrefixes: prefixes,
  };

  await writeJson(path.join(ctx.dnaDir, "module-resolution.json"), contract);
}
