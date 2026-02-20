import path from "node:path";
import { PipelineContext } from "../../types/pipeline";
import { writeJson, writeJsonl } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";

function inferRole(folderPath: string): string | undefined {
  const normalized = folderPath.toLowerCase();
  if (normalized.includes("pages") || normalized.includes("app")) {
    return "routing";
  }
  if (normalized.includes("components")) {
    return "ui";
  }
  if (normalized.includes("hooks")) {
    return "hooks";
  }
  if (normalized.includes("services") || normalized.includes("api")) {
    return "api";
  }
  if (normalized.includes("redux") || normalized.includes("store")) {
    return "state";
  }
  if (
    normalized.includes("assets") ||
    normalized.includes("styles") ||
    normalized.includes("theme")
  ) {
    return "theme";
  }
  if (normalized.includes("config")) {
    return "config";
  }
  if (normalized.includes("types")) {
    return "types";
  }
  return undefined;
}

export async function inventoryFilesAndStructure(
  ctx: PipelineContext,
): Promise<void> {
  const relFiles = ctx.allFiles.map((filePath) =>
    repoRelativePath(ctx.workingRepoPath, filePath),
  );

  const extensionCounts: Record<string, number> = {};
  const topLevelEntries: Record<string, number> = {};
  const folderRoles: Record<string, string> = {};

  const rows = relFiles.map((relPath) => {
    const ext = path.extname(relPath) || "<none>";
    extensionCounts[ext] = (extensionCounts[ext] ?? 0) + 1;

    const segments = relPath.split("/");
    const top = segments[0] ?? "<root>";
    topLevelEntries[top] = (topLevelEntries[top] ?? 0) + 1;

    if (segments.length > 1) {
      const dir = segments.slice(0, -1).join("/");
      const inferred = inferRole(dir);
      if (inferred && !folderRoles[dir]) {
        folderRoles[dir] = inferred;
      }
    }

    return {
      file: relPath,
      ext,
      top,
    };
  });

  const structure = {
    totalFiles: relFiles.length,
    topLevelEntries,
    extensionCounts,
    folderRoles,
    sampleFiles: relFiles.slice(0, 500),
  };

  await writeJson(path.join(ctx.dnaDir, "structure.json"), structure);
  await writeJsonl(path.join(ctx.indexesDir, "files.jsonl"), rows);
}
