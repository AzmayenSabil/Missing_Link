import path from "node:path";
import fg from "fast-glob";
import { simpleGit } from "simple-git";
import { Manifest, PipelineContext } from "../../types/pipeline";
import {
  fileExists,
  readJsonIfPossible,
  readTextSafe,
  writeJson,
} from "../../utils/fs";

async function findConfig(
  cwd: string,
  patterns: string[],
): Promise<string | undefined> {
  const matches = await fg(patterns, {
    cwd,
    onlyFiles: true,
    dot: true,
    absolute: true,
  });
  return matches[0];
}

async function readConfigSafe(
  filePath: string | undefined,
): Promise<{ present: boolean; parsed?: unknown; rawSnippet?: string }> {
  if (!filePath) {
    return { present: false };
  }

  const raw = await readTextSafe(filePath, 100_000);
  if (!raw) {
    return { present: true };
  }

  try {
    return { present: true, parsed: JSON.parse(raw) };
  } catch {
    return { present: true, rawSnippet: raw.slice(0, 2000) };
  }
}

export async function discoverStack(ctx: PipelineContext): Promise<void> {
  const packageJsonPath = path.join(ctx.workingRepoPath, "package.json");
  const packageJson =
    await readJsonIfPossible<Record<string, unknown>>(packageJsonPath);
  const deps = {
    ...(typeof packageJson?.dependencies === "object"
      ? (packageJson.dependencies as Record<string, string>)
      : {}),
    ...(typeof packageJson?.devDependencies === "object"
      ? (packageJson.devDependencies as Record<string, string>)
      : {}),
  };

  const hasDep = (name: string): boolean => Boolean(deps[name]);

  const tsconfigPresent = await fileExists(
    path.join(ctx.workingRepoPath, "tsconfig.json"),
  );
  const eslintPath = await findConfig(ctx.workingRepoPath, [
    ".eslintrc",
    ".eslintrc.json",
    ".eslintrc.js",
    ".eslintrc.cjs",
  ]);
  const prettierPath = await findConfig(ctx.workingRepoPath, [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    ".prettierrc.cjs",
  ]);
  const commitlintPath = await findConfig(ctx.workingRepoPath, [
    "commitlint.config.js",
    "commitlint.config.cjs",
    ".commitlintrc",
    ".commitlintrc.json",
  ]);

  let gitHead: string | undefined;
  try {
    gitHead = (await simpleGit(ctx.workingRepoPath).revparse(["HEAD"]))?.trim();
  } catch {
    gitHead = undefined;
  }

  const manifest: Manifest = {
    projectId: ctx.projectId,
    repoPath: ctx.workingRepoPath,
    stack: {
      next: hasDep("next"),
      react: hasDep("react"),
      typescript: hasDep("typescript") || tsconfigPresent,
      antd: hasDep("antd"),
      emotion: hasDep("@emotion/react") || hasDep("@emotion/styled"),
      reduxToolkit: hasDep("@reduxjs/toolkit"),
      swr: hasDep("swr"),
      axios: hasDep("axios"),
    },
    configs: {
      tsconfigPresent,
      eslintPresent: Boolean(eslintPath),
      prettierPresent: Boolean(prettierPath),
      commitlintPresent: Boolean(commitlintPath),
    },
    fingerprint: {
      scannedAt: new Date().toISOString(),
      totalFiles: ctx.allFiles.length,
      tsLikeFiles: ctx.tsLikeFiles.length,
      gitHead,
    },
  };

  const prettierConfig = await readConfigSafe(prettierPath);
  const eslintConfig = await readConfigSafe(eslintPath);

  const conventions = {
    prettier: {
      present: prettierConfig.present,
      file: prettierPath ? path.basename(prettierPath) : undefined,
      parsed: prettierConfig.parsed,
      rawSnippet: prettierConfig.rawSnippet,
    },
    eslint: {
      present: eslintConfig.present,
      file: eslintPath ? path.basename(eslintPath) : undefined,
      parsed: eslintConfig.parsed,
      rawSnippet: eslintConfig.rawSnippet,
    },
    commitlint: {
      present: Boolean(commitlintPath),
      file: commitlintPath ? path.basename(commitlintPath) : undefined,
    },
  };

  await writeJson(path.join(ctx.dnaDir, "manifest.json"), manifest);
  await writeJson(path.join(ctx.dnaDir, "conventions.json"), conventions);
}
