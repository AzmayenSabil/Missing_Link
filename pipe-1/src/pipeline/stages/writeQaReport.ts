import path from "node:path";
import { PipelineContext } from "../../types/pipeline";
import { writeJson } from "../../utils/fs";

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

  const readyForPhase2 = hasDepgraph && hasSignals;

  const qa = {
    counts: ctx.metrics,
    detected: tagCounts,
    warnings: ctx.warnings,
    readiness: {
      READY_FOR_PHASE_2: readyForPhase2,
    },
  };

  await writeJson(path.join(ctx.dnaDir, "qa_report.json"), qa);
  ctx.readyForPhase2 = readyForPhase2;
}
