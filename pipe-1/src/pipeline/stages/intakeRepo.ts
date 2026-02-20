import os from "node:os";
import path from "node:path";
import fg from "fast-glob";
import { simpleGit } from "simple-git";
import { CliPhase1Options, PipelineContext } from "../../types/pipeline";
import { mkdirp } from "../../utils/fs";
import { deriveProjectId } from "../../utils/paths";

export async function intakeRepo(
  options: CliPhase1Options,
): Promise<PipelineContext> {
  let workingRepoPath = options.repoPath;

  if (!workingRepoPath && options.gitUrl) {
    const repoNameGuess =
      options.gitUrl
        .split("/")
        .pop()
        ?.replace(/\.git$/, "") ?? "repo";
    const cloneDir = path.join(
      os.tmpdir(),
      "missing-link",
      `${repoNameGuess}-${Date.now()}`,
    );
    await mkdirp(path.dirname(cloneDir));
    await simpleGit().clone(options.gitUrl, cloneDir);
    workingRepoPath = cloneDir;
  }

  if (!workingRepoPath) {
    throw new Error("No repository path available after intake.");
  }

  const projectId = deriveProjectId(workingRepoPath, options.projectId);
  const outDir =
    options.outDir ?? path.resolve(process.cwd(), "..", "out", "pipe-1");
  const projectOutDir = path.join(outDir, projectId);
  const dnaDir = path.join(projectOutDir, "project-dna");
  const examplesDir = path.join(dnaDir, "examples");
  const indexesDir = path.join(projectOutDir, "indexes");

  await Promise.all([
    mkdirp(projectOutDir),
    mkdirp(dnaDir),
    mkdirp(examplesDir),
    mkdirp(indexesDir),
  ]);

  const allFiles = await fg(["**/*"], {
    cwd: workingRepoPath,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/out/**"],
  });

  const tsLikeFiles = allFiles.filter((filePath) =>
    /\.(ts|tsx|js|jsx)$/.test(filePath),
  );

  const context: PipelineContext = {
    input: options,
    repoPath: workingRepoPath,
    workingRepoPath,
    projectId,
    outDir,
    projectOutDir,
    dnaDir,
    examplesDir,
    indexesDir,
    allFiles,
    tsLikeFiles,
    exports: [],
    imports: [],
    depgraph: {
      adjacency: {},
      reverseAdjacency: {},
    },
    symbolIndex: {},
    hookExports: [],
    tokens: [],
    entryPoints: {},
    warnings: [],
    metrics: {
      files_scanned: allFiles.length,
      ts_files_parsed: 0,
      exports_count: 0,
      imports_edges_count: 0,
      imports_resolved_count: 0,
      tokens_count: 0,
    },
    folderRoles: {},
    pathAliases: {},
    aliasUsageDetected: false,
    openaiApiKey:
      options.openaiApiKey ?? process.env["OPENAI_API_KEY"] ?? undefined,
  };

  return context;
}
