import path from "node:path";
import { PipelineContext } from "../../types/pipeline";
import { writeJson } from "../../utils/fs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 1; // vacuously satisfied
  return Math.round((numerator / denominator) * 1000) / 1000;
}

/**
 * Estimate how likely it is that alias-style imports would resolve correctly
 * during code generation.
 *
 * Logic:
 *  - No aliases at all                              → 1.0  (not a concern)
 *  - Aliases configured AND usage detected          → 0.85 (well-configured)
 *  - Aliases configured but no usage detected       → 0.95 (configured, low risk)
 *  - Alias usage detected but NONE configured       → 0.40 (ambiguous)
 */
function aliasConfidence(
  pathAliases: Record<string, string[]>,
  aliasUsageDetected: boolean,
): number {
  const hasAliases = Object.keys(pathAliases).length > 0;
  if (!hasAliases && !aliasUsageDetected) return 1.0;
  if (hasAliases && aliasUsageDetected) return 0.85;
  if (hasAliases && !aliasUsageDetected) return 0.95;
  return 0.4; // usage detected but nothing configured
}

// ─── Stage entry point ────────────────────────────────────────────────────────

export async function writeQaReport(ctx: PipelineContext): Promise<void> {
  const tagCounts = {
    hooks: ctx.exports.filter((item) => item.tags.includes("hook")).length,
    components: ctx.exports.filter((item) => item.tags.includes("component"))
      .length,
    services: ctx.exports.filter((item) => item.tags.includes("service"))
      .length,
    slices: ctx.exports.filter((item) => item.tags.includes("slice")).length,
  };

  const hasDepgraph = Object.keys(ctx.depgraph.adjacency).length > 0;
  const hasSignals =
    ctx.metrics.exports_count > 20 ||
    tagCounts.hooks > 0 ||
    tagCounts.components > 0 ||
    tagCounts.services > 0 ||
    tagCounts.slices > 0;

  // ── Coverage metrics ───────────────────────────────────────────────────────
  const tsFilesParsedRatio = ratio(
    ctx.metrics.ts_files_parsed,
    ctx.tsLikeFiles.length,
  );
  const importsResolvedRatio = ratio(
    ctx.metrics.imports_resolved_count,
    ctx.metrics.imports_edges_count,
  );
  const aliasResolutionConfidence = aliasConfidence(
    ctx.pathAliases,
    ctx.aliasUsageDetected,
  );

  // ── Missing critical contracts ─────────────────────────────────────────────
  const missingCriticalContracts: string[] = [];

  if (ctx.tsLikeFiles.length > 0 && ctx.metrics.ts_files_parsed === 0) {
    missingCriticalContracts.push("symbol-extraction");
  }
  if (!hasDepgraph && ctx.tsLikeFiles.length > 5) {
    missingCriticalContracts.push("dependency-graph");
  }
  if (tsFilesParsedRatio < 0.5 && ctx.tsLikeFiles.length > 10) {
    missingCriticalContracts.push("low-parse-coverage");
  }

  const readyForPhase2 =
    hasDepgraph && hasSignals && missingCriticalContracts.length === 0;

  const qa = {
    counts: ctx.metrics,
    detected: tagCounts,
    warnings: ctx.warnings,
    coverage: {
      tsFilesParsedRatio,
      importsResolvedRatio,
      aliasResolutionConfidence,
    },
    readiness: {
      READY_FOR_PHASE_2: readyForPhase2,
      missingCriticalContracts,
    },
  };

  await writeJson(path.join(ctx.dnaDir, "qa_report.json"), qa);
  ctx.readyForPhase2 = readyForPhase2;
}
