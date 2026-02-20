import path from "node:path";
import { PipelineContext } from "../../types/pipeline";
import { readTextSafe, writeJson } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";

function lineNumberFromIndex(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}

export async function extractApiContract(ctx: PipelineContext): Promise<void> {
  const axiosInstances: Array<{
    file: string;
    variableName: string;
    baseURL?: string;
    requestInterceptor: boolean;
    responseInterceptor: boolean;
  }> = [];

  const endpointLiterals: Array<{
    file: string;
    method: string;
    path: string;
    line: number;
  }> = [];
  const serviceModules: Array<{ file: string; reason: string }> = [];

  for (const absFile of ctx.tsLikeFiles) {
    const text = await readTextSafe(absFile);
    if (!text) {
      continue;
    }

    const relFile = repoRelativePath(ctx.workingRepoPath, absFile);

    const axiosCreateRegex =
      /(const|let|var)\s+(\w+)\s*=\s*axios\.create\(([^)]*)\)/g;
    for (const match of text.matchAll(axiosCreateRegex)) {
      const variableName = match[2];
      const configText = match[3] ?? "";
      const baseURLMatch = configText.match(
        /baseURL\s*:\s*["'`]([^"'`]+)["'`]/,
      );

      axiosInstances.push({
        file: relFile,
        variableName,
        baseURL: baseURLMatch?.[1],
        requestInterceptor: text.includes(
          `${variableName}.interceptors.request.use`,
        ),
        responseInterceptor: text.includes(
          `${variableName}.interceptors.response.use`,
        ),
      });

      if (!ctx.entryPoints.api) {
        ctx.entryPoints.api = relFile;
      }
    }

    const endpointRegex =
      /\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/g;
    for (const match of text.matchAll(endpointRegex)) {
      const index = match.index ?? 0;
      endpointLiterals.push({
        file: relFile,
        method: match[1],
        path: match[2],
        line: lineNumberFromIndex(text, index),
      });
    }

    const lower = relFile.toLowerCase();
    const isServicePath =
      lower.includes("/services/") || lower.includes("/api/");
    const looksLikeService =
      /export\s+(const|function|class|default)/.test(text) &&
      /axios|\.get\(|\.post\(|\.put\(|\.patch\(|\.delete\(/.test(text);

    if (isServicePath && looksLikeService) {
      serviceModules.push({
        file: relFile,
        reason: "path+http usage",
      });

      if (!ctx.entryPoints.api) {
        ctx.entryPoints.api = relFile;
      }
    }
  }

  const apiContract = {
    axiosInstances,
    serviceModules,
    endpointLiterals,
    summary: {
      axiosInstances: axiosInstances.length,
      serviceModules: serviceModules.length,
      endpointLiterals: endpointLiterals.length,
    },
  };

  await writeJson(path.join(ctx.dnaDir, "api-contract.json"), apiContract);
}
