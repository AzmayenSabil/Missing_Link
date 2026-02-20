/**
 * analyzeArchitectureBoundaries
 *
 * Uses the folder-role map (from inventoryFilesAndStructure) and the dependency
 * graph to detect cross-layer imports.  Produces `architecture-boundaries.json`.
 */
import path from "node:path";
import { ArchitectureBoundaries, PipelineContext } from "../../types/pipeline";
import { writeJson } from "../../utils/fs";

// Role pairs that represent suspicious cross-layer dependencies.
// Ordered by significance so the most important violations surface first.
const VIOLATION_RULES: Array<{ from: string; to: string; reason: string }> = [
  { from: "state", to: "ui", reason: "state should not depend on UI" },
  { from: "api", to: "ui", reason: "service layer should not depend on UI" },
  {
    from: "ui",
    to: "routing",
    reason: "component imports page (circular risk)",
  },
  { from: "config", to: "ui", reason: "config should not depend on UI" },
  {
    from: "types",
    to: "ui",
    reason: "type definitions should not depend on UI",
  },
  { from: "hooks", to: "routing", reason: "hook imports page (coupling risk)" },
];

const MAX_VIOLATIONS_SAMPLE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given a relative file path and the folderRoles map, return the role of the
 * folder that most-specifically contains this file (longest prefix match).
 */
function roleForFile(
  relFile: string,
  folderRoles: Record<string, string>,
): string | undefined {
  // Normalise to posix separators (folderRoles keys are already posix)
  const normalized = relFile.split(path.sep).join("/");
  let bestRole: string | undefined;
  let bestLen = -1;

  for (const [folder, role] of Object.entries(folderRoles)) {
    if (normalized.startsWith(folder + "/") && folder.length > bestLen) {
      bestLen = folder.length;
      bestRole = role;
    }
  }

  return bestRole;
}

// ─── Stage entry point ────────────────────────────────────────────────────────

export async function analyzeArchitectureBoundaries(
  ctx: PipelineContext,
): Promise<void> {
  const { adjacency } = ctx.depgraph;
  const { folderRoles } = ctx;

  const roles = Array.from(new Set(Object.values(folderRoles))).sort();

  // ── Build role-to-role edge matrix (unique pairs only) ───────────────────
  const roleEdgeSet = new Map<string, Set<string>>();
  for (const role of roles) {
    roleEdgeSet.set(role, new Set());
  }

  const violations: ArchitectureBoundaries["violationsSample"] = [];

  for (const [fromFile, toFiles] of Object.entries(adjacency)) {
    const fromRole = roleForFile(fromFile, folderRoles);
    if (!fromRole) continue;

    for (const toFile of toFiles) {
      const toRole = roleForFile(toFile, folderRoles);
      if (!toRole || toRole === fromRole) continue;

      // Record the edge
      if (!roleEdgeSet.has(fromRole)) {
        roleEdgeSet.set(fromRole, new Set());
      }
      roleEdgeSet.get(fromRole)!.add(toRole);

      // Check violation rules
      if (violations.length < MAX_VIOLATIONS_SAMPLE) {
        for (const rule of VIOLATION_RULES) {
          if (rule.from === fromRole && rule.to === toRole) {
            violations.push({ from: fromFile, to: toFile, file: fromFile });
            break;
          }
        }
      }
    }
  }

  // Serialize roleEdgeSet → plain object
  const roleEdges: Record<string, string[]> = {};
  for (const [role, edges] of roleEdgeSet.entries()) {
    if (edges.size > 0) {
      roleEdges[role] = Array.from(edges).sort();
    }
  }

  const boundaries: ArchitectureBoundaries = {
    roles,
    roleEdges,
    violationsSample: violations,
  };

  await writeJson(
    path.join(ctx.dnaDir, "architecture-boundaries.json"),
    boundaries,
  );
}
