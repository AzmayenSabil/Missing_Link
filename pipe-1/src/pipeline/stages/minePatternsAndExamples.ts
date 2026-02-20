import path from "node:path";
import fs from "node:fs";
import { PipelineContext } from "../../types/pipeline";
import { readTextSafe, writeJson } from "../../utils/fs";
import { repoRelativePath } from "../../utils/paths";
import { getSnippetAroundIndex } from "../../utils/snippets";

interface PatternExample {
  pattern: string;
  file?: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
  found: boolean;
}

async function findPatternInFiles(
  ctx: PipelineContext,
  predicate: (file: string, text: string) => number | undefined,
): Promise<PatternExample | undefined> {
  for (const absFile of ctx.tsLikeFiles) {
    const text = await readTextSafe(absFile);
    if (!text) {
      continue;
    }

    const idx = predicate(absFile, text);
    if (idx !== undefined && idx >= 0) {
      const snippet = getSnippetAroundIndex(text, idx, 30);
      return {
        pattern: "",
        file: repoRelativePath(ctx.workingRepoPath, absFile),
        startLine: snippet.startLine,
        endLine: snippet.endLine,
        snippet: snippet.text,
        found: true,
      };
    }
  }

  return undefined;
}

function toMarkdown(
  title: string,
  example: PatternExample | undefined,
): string {
  if (!example || !example.found || !example.file || !example.snippet) {
    return `# ${title}\n\nNo representative example found in this scan.\n`;
  }

  return `# ${title}\n\n- File: ${example.file}\n- Line range: ${example.startLine}-${example.endLine}\n\n\`\`\`ts\n${example.snippet}\n\`\`\`\n`;
}

export async function minePatternsAndExamples(
  ctx: PipelineContext,
): Promise<void> {
  const authorize = await findPatternInFiles(ctx, (file, text) => {
    const isPage = /(^|[\\/])(pages|app)[\\/]/i.test(file);
    if (!isPage) {
      return undefined;
    }
    const idx = text.search(/\bAuthorize\b/);
    return idx >= 0 ? idx : undefined;
  });

  if (authorize?.file) {
    ctx.entryPoints.authorize = authorize.file;
  }

  const useTable = await findPatternInFiles(ctx, (_file, text) => {
    const idx = text.search(/\buseTable\b/);
    return idx >= 0 ? idx : undefined;
  });

  const serviceLayer = await findPatternInFiles(ctx, (file, text) => {
    if (!/services|api/i.test(file)) {
      return undefined;
    }
    const idx = text.search(
      /axios|\.get\(|\.post\(|\.put\(|\.patch\(|\.delete\(/,
    );
    return idx >= 0 ? idx : undefined;
  });

  const reduxSlice = await findPatternInFiles(ctx, (_file, text) => {
    const idx = text.search(/createSlice\s*\(/);
    return idx >= 0 ? idx : undefined;
  });

  const styling = await findPatternInFiles(ctx, (_file, text) => {
    const idx = text.search(
      /@emotion|styled\(|createGlobalStyle|:root|--[a-zA-Z0-9-_]+\s*:/,
    );
    return idx >= 0 ? idx : undefined;
  });

  const cards: PatternExample[] = [
    {
      pattern: "Authorize wrapper",
      ...authorize,
      found: Boolean(authorize?.found),
    },
    { pattern: "useTable usage", ...useTable, found: Boolean(useTable?.found) },
    {
      pattern: "service layer",
      ...serviceLayer,
      found: Boolean(serviceLayer?.found),
    },
    {
      pattern: "redux slice",
      ...reduxSlice,
      found: Boolean(reduxSlice?.found),
    },
    { pattern: "styling", ...styling, found: Boolean(styling?.found) },
  ];

  await writeJson(path.join(ctx.dnaDir, "pattern-cards.json"), cards);

  await Promise.all([
    fs.promises.writeFile(
      path.join(ctx.examplesDir, "authorize-page.md"),
      toMarkdown("Authorize Page Example", authorize),
      "utf8",
    ),
    fs.promises.writeFile(
      path.join(ctx.examplesDir, "service-layer.md"),
      toMarkdown("Service Layer Example", serviceLayer),
      "utf8",
    ),
    fs.promises.writeFile(
      path.join(ctx.examplesDir, "redux-slice.md"),
      toMarkdown("Redux Slice Example", reduxSlice),
      "utf8",
    ),
    fs.promises.writeFile(
      path.join(ctx.examplesDir, "hook-usage.md"),
      toMarkdown("Hook Usage Example", useTable),
      "utf8",
    ),
    fs.promises.writeFile(
      path.join(ctx.examplesDir, "styling.md"),
      toMarkdown("Styling Example", styling),
      "utf8",
    ),
  ]);
}
