/**
 * inferNamingConventions
 *
 * Scans file paths and ctx.exports to infer naming patterns used in the repo.
 * Produces `naming-conventions.json`.  Pure string analysis — no AST.
 */
import path from "node:path";
import { NamingConventions, PipelineContext } from "../../types/pipeline";
import { writeJson } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RE_KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const RE_CAMEL = /^[a-z][a-zA-Z0-9]*$/;
const RE_PASCAL = /^[A-Z][a-zA-Z0-9]*$/;

type FileStyle = "kebab" | "camel" | "pascal" | "mixed";

function classifyBasename(basename: string): FileStyle | null {
  if (RE_KEBAB.test(basename)) return "kebab";
  if (RE_PASCAL.test(basename)) return "pascal";
  if (RE_CAMEL.test(basename)) return "camel";
  return null;
}

function dominantStyle(counts: Record<FileStyle, number>): FileStyle {
  const entries = Object.entries(counts) as [FileStyle, number][];
  const total = entries.reduce((s, [, c]) => s + c, 0);
  if (total === 0) return "mixed";
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [top] = sorted;
  // "dominant" = at least 55% of classified files
  if (top[1] / total >= 0.55) return top[0];
  return "mixed";
}

// ─── Stage entry point ────────────────────────────────────────────────────────

export async function inferNamingConventions(
  ctx: PipelineContext,
): Promise<void> {
  const counts: Record<FileStyle, number> = {
    kebab: 0,
    camel: 0,
    pascal: 0,
    mixed: 0,
  };

  let tsTotal = 0;
  let barrelCount = 0;
  let testCount = 0;
  let specCount = 0;

  for (const absFile of ctx.tsLikeFiles) {
    const relFile = repoRelativePath(ctx.workingRepoPath, absFile);
    const base = path.basename(relFile, path.extname(relFile));

    tsTotal++;

    // Barrel detection
    if (base === "index") {
      barrelCount++;
      continue; // skip "index" from naming style scoring
    }

    // Test file detection
    if (base.endsWith(".test")) {
      testCount++;
      continue;
    }
    if (base.endsWith(".spec")) {
      specCount++;
      continue;
    }

    // Strip common suffixes before style classification
    const stripped = base
      .replace(/\.(test|spec|stories|story)$/, "")
      .replace(
        /\.(page|component|hook|service|slice|store|model|types|utils|helpers|constants)$/i,
        "",
      );

    const style = classifyBasename(stripped);
    if (style && style !== "mixed") {
      counts[style]++;
    }
  }

  // ── Component naming style ───────────────────────────────────────────────
  const componentExports = ctx.exports.filter((e) =>
    e.tags.includes("component"),
  );
  const pascalComponents = componentExports.filter((e) =>
    RE_PASCAL.test(e.symbol),
  ).length;
  const componentStyle: NamingConventions["componentStyle"] =
    componentExports.length === 0
      ? "unknown"
      : pascalComponents / componentExports.length >= 0.8
        ? "PascalCase"
        : "mixed";

  // ── Hook prefix ──────────────────────────────────────────────────────────
  const hookExports = ctx.exports.filter((e) => e.tags.includes("hook"));
  const usePrefixHooks = hookExports.filter((e) =>
    e.symbol.startsWith("use"),
  ).length;
  const hookPrefix: NamingConventions["hookPrefix"] =
    hookExports.length === 0
      ? "unknown"
      : usePrefixHooks / hookExports.length >= 0.9
        ? "use"
        : "mixed";

  // ── Barrel usage ratio ───────────────────────────────────────────────────
  const barrelUsageRatio =
    tsTotal > 0 ? Math.round((barrelCount / tsTotal) * 1000) / 1000 : 0;

  // ── Test file pattern ────────────────────────────────────────────────────
  let testFilePattern: NamingConventions["testFilePattern"] = null;
  if (testCount > 0 && specCount === 0) testFilePattern = "test";
  else if (specCount > 0 && testCount === 0) testFilePattern = "spec";
  else if (testCount > 0 && specCount > 0) testFilePattern = "mixed";

  const conventions: NamingConventions = {
    fileStyle: dominantStyle(counts),
    componentStyle,
    hookPrefix,
    barrelUsageRatio,
    ...(testFilePattern !== null ? { testFilePattern } : {}),
  };

  await writeJson(
    path.join(ctx.dnaDir, "naming-conventions.json"),
    conventions,
  );
}
