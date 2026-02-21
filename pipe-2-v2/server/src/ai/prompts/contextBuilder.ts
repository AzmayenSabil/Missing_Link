/**
 * contextBuilder.ts – Assembles pipe-1 project-dna + indexes data into a
 * prompt-friendly string for OpenAI calls.
 *
 * Keeps the output under ~4000 tokens by summarising large structures.
 */

import type { Phase1Indexes, SymbolIndex, DepGraph } from "../../contracts/phase2";
import type { ProjectDNA } from "../../services/phase1Loader.service";

/**
 * Build a structured codebase context string from pipe-1 outputs.
 */
export function buildCodebaseContext(
  dna: ProjectDNA,
  indexes: Phase1Indexes,
): string {
  const sections: string[] = [];

  // ── 1. Project Overview ──────────────────────────────────────────────────
  sections.push(buildProjectOverview(dna.manifest));

  // ── 2. Folder Structure & Roles ──────────────────────────────────────────
  sections.push(buildFolderStructure(dna.structure));

  // ── 3. API Layer ─────────────────────────────────────────────────────────
  sections.push(buildApiSummary(dna.apiContract));

  // ── 4. State Management ──────────────────────────────────────────────────
  sections.push(buildStateSummary(dna.stateContract));

  // ── 5. Custom Hooks ──────────────────────────────────────────────────────
  sections.push(buildHooksSummary(dna.hooksContract));

  // ── 6. Architectural Rules ───────────────────────────────────────────────
  sections.push(buildRules(dna.rules));

  // ── 7. Dependency Graph (top edges) ──────────────────────────────────────
  sections.push(buildDepGraphSummary(indexes.depGraph));

  // ── 8. Key Symbols ───────────────────────────────────────────────────────
  sections.push(buildSymbolSummary(indexes.symbolIndex));

  // ── 9. Complete File List ────────────────────────────────────────────────
  sections.push(buildFileList(indexes.allFiles));

  return sections.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildProjectOverview(manifest: Record<string, unknown>): string {
  const stack = manifest.stack as Record<string, boolean> | undefined;
  const fingerprint = manifest.fingerprint as Record<string, unknown> | undefined;

  const techs: string[] = [];
  if (stack) {
    for (const [tech, present] of Object.entries(stack)) {
      if (present) techs.push(tech);
    }
  }

  const totalFiles = fingerprint?.totalFiles ?? "unknown";
  const tsFiles = fingerprint?.tsLikeFiles ?? "unknown";

  return [
    "## Project Overview",
    `Stack: ${techs.length > 0 ? techs.join(", ") : "unknown"}`,
    `Total files: ${totalFiles} (${tsFiles} TypeScript/TSX)`,
  ].join("\n");
}

function buildFolderStructure(structure: Record<string, unknown>): string {
  const folderRoles = structure.folderRoles as Record<string, string> | undefined;
  if (!folderRoles || Object.keys(folderRoles).length === 0) return "";

  const lines = Object.entries(folderRoles).map(
    ([folder, role]) => `  ${folder} → ${role}`,
  );

  return ["## Folder Structure & Roles", ...lines].join("\n");
}

function buildApiSummary(apiContract: Record<string, unknown>): string {
  const lines: string[] = ["## API Layer"];

  const axiosInstances = apiContract.axiosInstances as Array<Record<string, unknown>> | undefined;
  if (axiosInstances && axiosInstances.length > 0) {
    for (const inst of axiosInstances) {
      lines.push(`Axios instance: ${inst.variableName} (file: ${inst.file}, base: ${inst.baseURL ?? "N/A"})`);
    }
  }

  const serviceModules = apiContract.serviceModules as Array<Record<string, unknown>> | undefined;
  if (serviceModules && serviceModules.length > 0) {
    lines.push(`Service modules: ${serviceModules.map((s) => s.file).join(", ")}`);
  }

  const endpoints = apiContract.endpointLiterals as Array<Record<string, unknown>> | undefined;
  if (endpoints && endpoints.length > 0) {
    for (const ep of endpoints.slice(0, 10)) {
      lines.push(`  ${ep.method ?? "?"} ${ep.path ?? ep.literal ?? "?"} (${ep.file})`);
    }
  }

  return lines.length > 1 ? lines.join("\n") : "";
}

function buildStateSummary(stateContract: Record<string, unknown>): string {
  const lines: string[] = ["## State Management"];

  const slices = stateContract.sliceFiles as Array<Record<string, unknown>> | undefined;
  if (slices && slices.length > 0) {
    for (const s of slices) {
      lines.push(`Redux slice: ${s.sliceName} (${s.file})`);
    }
  }

  const storeFiles = stateContract.storeFiles as string[] | undefined;
  if (storeFiles && storeFiles.length > 0) {
    lines.push(`Store: ${storeFiles.join(", ")}`);
  }

  const persistUsage = stateContract.reduxPersistUsage as string[] | undefined;
  if (persistUsage && persistUsage.length > 0) {
    lines.push(`Redux Persist used in: ${persistUsage.join(", ")}`);
  }

  return lines.length > 1 ? lines.join("\n") : "";
}

function buildHooksSummary(hooksContract: Record<string, unknown>): string {
  const lines: string[] = ["## Custom Hooks"];

  const hookExports = hooksContract.hookExports as Array<Record<string, unknown>> | undefined;
  if (hookExports && hookExports.length > 0) {
    for (const h of hookExports) {
      lines.push(`  ${h.hook} (${h.file})`);
    }
  }

  return lines.length > 1 ? lines.join("\n") : "";
}

function buildRules(rules: Record<string, unknown>): string {
  const ruleList = rules.rules as string[] | undefined;
  if (!ruleList || ruleList.length === 0) return "";

  return [
    "## Architectural Rules",
    ...ruleList.map((r) => `- ${r}`),
  ].join("\n");
}

function buildDepGraphSummary(depGraph: DepGraph): string {
  const entries = Object.entries(depGraph.adjacency);
  if (entries.length === 0) return "";

  // Sort by number of edges (most connected first), take top 30
  const sorted = entries
    .filter(([, deps]) => deps.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30);

  const lines = sorted.map(
    ([file, deps]) => `  ${file} → ${deps.slice(0, 5).join(", ")}${deps.length > 5 ? ` (+${deps.length - 5} more)` : ""}`,
  );

  return ["## Dependency Graph (top edges)", ...lines].join("\n");
}

function buildSymbolSummary(symbolIndex: SymbolIndex): string {
  const entries = Object.entries(symbolIndex);
  if (entries.length === 0) return "";

  // Take top 100 symbols
  const top = entries.slice(0, 100);
  const lines = top.map(
    ([name, meta]) => `  ${name} (${meta.file}, ${meta.kind}, [${meta.tags.join(",")}])`,
  );

  return ["## Key Symbols", ...lines].join("\n");
}

function buildFileList(allFiles: string[]): string {
  if (allFiles.length === 0) return "";
  const MAX_FILES = 300;
  const truncated = allFiles.length > MAX_FILES;
  const files = truncated ? allFiles.slice(0, MAX_FILES) : allFiles;
  const lines = files.map((f) => `  ${f}`);
  if (truncated) {
    lines.push(`  ... (${allFiles.length - MAX_FILES} more files not shown)`);
  }
  return ["## All File Paths", ...lines].join("\n");
}
