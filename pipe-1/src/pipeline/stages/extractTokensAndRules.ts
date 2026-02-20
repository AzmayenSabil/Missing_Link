import path from "node:path";
import fg from "fast-glob";
import { PipelineContext } from "../../types/pipeline";
import { readTextSafe, writeJson } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";

export async function extractTokensAndRules(
  ctx: PipelineContext,
): Promise<void> {
  const cssLikeFiles = await fg(["**/*.{css,scss,sass,less}"], {
    cwd: ctx.workingRepoPath,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/out/**"],
  });

  const tokens: Array<{ name: string; value: string; file: string }> = [];
  const tokenRegex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;

  for (const absFile of cssLikeFiles) {
    const text = await readTextSafe(absFile);
    if (!text) {
      continue;
    }

    const relFile = repoRelativePath(ctx.workingRepoPath, absFile);
    for (const match of text.matchAll(tokenRegex)) {
      tokens.push({
        name: `--${match[1]}`,
        value: match[2].trim(),
        file: relFile,
      });
    }
  }

  const themeCandidates = ctx.allFiles
    .map((filePath) => repoRelativePath(ctx.workingRepoPath, filePath))
    .filter((filePath) => /(theme|token|style)/i.test(filePath));

  const rules: string[] = [];

  if (tokens.length > 0) {
    rules.push("Do not use hex colors directly; use design tokens.");
    if (!ctx.entryPoints.theme) {
      ctx.entryPoints.theme = tokens[0].file;
    }
  }

  const authorizeExists = ctx.allFiles.some((absFile) =>
    /authorize/i.test(absFile),
  );
  if (authorizeExists) {
    rules.push(
      "Pages should wrap route content with Authorize where access control is required.",
    );
  }

  const manifestPath = path.join(ctx.dnaDir, "manifest.json");
  const manifestText = await readTextSafe(manifestPath);
  if (manifestText && /"antd"\s*:\s*true/.test(manifestText)) {
    rules.push("Prefer Ant Design components for consistent UI patterns.");
  }

  if (rules.length === 0) {
    rules.push("No strong global style or wrapper rules inferred in MVP scan.");
  }

  ctx.tokens = tokens;
  ctx.metrics.tokens_count = tokens.length;

  await Promise.all([
    writeJson(path.join(ctx.dnaDir, "tokens.json"), {
      tokens,
      themeCandidates,
    }),
    writeJson(path.join(ctx.dnaDir, "rules.json"), { rules }),
  ]);
}
