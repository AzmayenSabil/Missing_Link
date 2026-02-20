import path from "node:path";
import MiniSearch from "minisearch";
import { ChunkRecord, PipelineContext } from "../../types/pipeline";
import { readTextSafe, writeJson, writeJsonl } from "../../utils/fs";

function clampRange(
  startLine: number,
  endLine: number,
  totalLines: number,
): { start: number; end: number } {
  const start = Math.max(1, startLine);
  const end = Math.min(totalLines, Math.max(start, endLine));
  if (end - start + 1 > 80) {
    return { start, end: start + 79 };
  }
  return { start, end };
}

export async function buildChunksAndSearchIndex(
  ctx: PipelineContext,
): Promise<void> {
  const chunks: ChunkRecord[] = [];
  const fileTextCache = new Map<string, string>();

  let chunkCounter = 1;

  for (const exp of ctx.exports) {
    const absPath = path.join(ctx.workingRepoPath, exp.file);
    let text = fileTextCache.get(absPath);
    if (!text) {
      text = (await readTextSafe(absPath)) ?? "";
      fileTextCache.set(absPath, text);
    }

    if (!text) {
      continue;
    }

    const lines = text.split(/\r?\n/);
    const start = exp.startLine ?? 1;
    const end = exp.endLine ?? Math.min(lines.length, start + 30);
    const bounded = clampRange(start, end, lines.length);

    const snippet = lines.slice(bounded.start - 1, bounded.end).join("\n");
    if (snippet.trim().length === 0) {
      continue;
    }

    chunks.push({
      chunk_id: `chunk_${chunkCounter++}`,
      file: exp.file,
      tags: exp.tags,
      text: snippet,
    });
  }

  if (chunks.length === 0) {
    for (const relFile of ctx.tsLikeFiles
      .slice(0, 200)
      .map((abs) => abs.replace(`${ctx.workingRepoPath}${path.sep}`, ""))) {
      const absPath = path.join(ctx.workingRepoPath, relFile);
      const text = await readTextSafe(absPath, 20_000);
      if (!text) {
        continue;
      }
      chunks.push({
        chunk_id: `chunk_${chunkCounter++}`,
        file: relFile.split(path.sep).join("/"),
        tags: ["file"],
        text,
      });
    }
  }

  const miniSearch = new MiniSearch<ChunkRecord>({
    fields: ["text", "file", "tags"],
    storeFields: ["chunk_id", "file", "tags"],
    idField: "chunk_id",
    searchOptions: {
      prefix: true,
      fuzzy: 0.1,
    },
  });

  miniSearch.addAll(chunks);

  await Promise.all([
    writeJsonl(path.join(ctx.indexesDir, "chunks.jsonl"), chunks),
    writeJson(
      path.join(ctx.indexesDir, "search_index.json"),
      miniSearch.toJSON(),
    ),
  ]);
}
