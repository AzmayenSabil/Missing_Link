import path from "node:path";
import { PipelineContext } from "../../types/pipeline";
import { readTextSafe, writeJson } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";

export async function extractStateAndHooksContracts(
  ctx: PipelineContext,
): Promise<void> {
  const sliceFiles: Array<{ file: string; sliceName?: string }> = [];
  const thunkNames: Array<{ file: string; thunkName: string }> = [];
  const storeFiles: string[] = [];
  const reduxPersistUsage: string[] = [];

  for (const absFile of ctx.tsLikeFiles) {
    const text = await readTextSafe(absFile);
    if (!text) {
      continue;
    }

    const relFile = repoRelativePath(ctx.workingRepoPath, absFile);

    if (/createSlice\s*\(/.test(text)) {
      const sliceName = text.match(/name\s*:\s*["'`]([^"'`]+)["'`]/)?.[1];
      sliceFiles.push({ file: relFile, sliceName });
    }

    for (const thunkMatch of text.matchAll(
      /const\s+(\w+)\s*=\s*createAsyncThunk\s*\(/g,
    )) {
      thunkNames.push({ file: relFile, thunkName: thunkMatch[1] });
    }

    if (/configureStore\s*\(/.test(text)) {
      storeFiles.push(relFile);
      if (!ctx.entryPoints.store) {
        ctx.entryPoints.store = relFile;
      }
    }

    if (/redux-persist|persistReducer\s*\(|persistStore\s*\(/.test(text)) {
      reduxPersistUsage.push(relFile);
    }
  }

  const hookExports = ctx.hookExports.map((record) => ({
    hook: record.symbol,
    file: record.file,
  }));

  const hookImportCounts = new Map<string, number>();
  for (const importRow of ctx.imports) {
    for (const symbol of importRow.importedSymbols) {
      if (/^use[A-Z0-9_]/.test(symbol)) {
        hookImportCounts.set(symbol, (hookImportCounts.get(symbol) ?? 0) + 1);
      }
    }
  }

  const mostImportedHooks = Array.from(hookImportCounts.entries())
    .map(([hook, count]) => ({ hook, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  const stateContract = {
    sliceFiles,
    thunkNames,
    storeFiles,
    reduxPersistUsage,
  };

  const hooksContract = {
    hookExports,
    mostImportedHooks,
  };

  await Promise.all([
    writeJson(path.join(ctx.dnaDir, "state-contract.json"), stateContract),
    writeJson(path.join(ctx.dnaDir, "hooks-contract.json"), hooksContract),
  ]);
}
