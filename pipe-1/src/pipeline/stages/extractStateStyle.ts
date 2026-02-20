/**
 * extractStateStyle
 *
 * Detects Redux usage patterns beyond slice/thunk presence:
 * - Typed hook wrappers (useAppDispatch / useAppSelector)
 * - Direct useSelector / useDispatch call counts
 * - Store file location
 *
 * Produces `state-style.json`.  Pure regex-over-text — no AST required.
 */
import path from "node:path";
import { StateStyle, PipelineContext } from "../../types/pipeline";
import { readTextSafe, writeJson } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";

export async function extractStateStyle(ctx: PipelineContext): Promise<void> {
  let useAppDispatchFound = false;
  let useAppSelectorFound = false;
  const typedHookFiles: string[] = [];

  let directUseSelectorCount = 0;
  let directUseDispatchCount = 0;

  for (const absFile of ctx.tsLikeFiles) {
    const text = await readTextSafe(absFile);
    if (!text) continue;

    const relFile = repoRelativePath(ctx.workingRepoPath, absFile);

    // ── Typed hook definitions ─────────────────────────────────────────────
    // e.g. export const useAppDispatch = () => useDispatch<AppDispatch>()
    const definesTypedDispatch =
      /\buseAppDispatch\b/.test(text) && /useDispatch\s*[<(]/.test(text);
    const definesTypedSelector =
      /\buseAppSelector\b/.test(text) && /useSelector\s*[<(]/.test(text);

    if (definesTypedDispatch) {
      useAppDispatchFound = true;
      if (!typedHookFiles.includes(relFile)) typedHookFiles.push(relFile);
    }
    if (definesTypedSelector) {
      useAppSelectorFound = true;
      if (!typedHookFiles.includes(relFile)) typedHookFiles.push(relFile);
    }

    // ── Direct useSelector usage count ────────────────────────────────────
    // Count call-sites: useSelector( — but not the definition above
    const useSelectorMatches = text.match(/\buseSelector\s*\(/g);
    if (useSelectorMatches) {
      // Subtract definitions: lines with "useSelector<" are definition wrappers
      const definitionCount = (text.match(/useSelector\s*[<(]/g) ?? []).filter(
        (m) => m.includes("<"),
      ).length;
      directUseSelectorCount += Math.max(
        0,
        useSelectorMatches.length - definitionCount,
      );
    }

    // ── Direct useDispatch usage count ────────────────────────────────────
    const useDispatchMatches = text.match(/\buseDispatch\s*\(\s*\)/g);
    if (useDispatchMatches) {
      const definitionCount = (
        text.match(/=\s*\(\s*\)\s*=>\s*useDispatch/g) ?? []
      ).length;
      directUseDispatchCount += Math.max(
        0,
        useDispatchMatches.length - definitionCount,
      );
    }
  }

  const stateStyle: StateStyle = {
    typedHooks: {
      useAppDispatch: useAppDispatchFound,
      useAppSelector: useAppSelectorFound,
      typeFiles: typedHookFiles,
    },
    directUseSelectorCount,
    directUseDispatchCount,
    ...(ctx.entryPoints.store ? { storeLocation: ctx.entryPoints.store } : {}),
  };

  await writeJson(path.join(ctx.dnaDir, "state-style.json"), stateStyle);
}
