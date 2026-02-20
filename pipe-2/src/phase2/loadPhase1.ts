/**
 * loadPhase1.ts – Load and validate phase-1 output artefacts.
 *
 * Phase-1 writes its outputs to:
 *   <phase1OutDir>/indexes/search_index.json
 *   <phase1OutDir>/indexes/symbol_index.json
 *   <phase1OutDir>/indexes/depgraph.json
 *   <phase1OutDir>/indexes/files.jsonl  (optional)
 *   <phase1OutDir>/indexes/chunks.jsonl (optional)
 *
 * The loader degrades gracefully when optional files are absent.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  Phase1Indexes,
  SearchIndexEntry,
  SymbolIndex,
  DepGraph,
} from "../contracts/phase2";

// ---------------------------------------------------------------------------
// Internal JSON reading helpers
// ---------------------------------------------------------------------------

function readJsonSync<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(
      `  [loadPhase1] Warning: could not parse ${filePath}: ${(err as Error).message}`,
    );
    return null;
  }
}

async function readJsonlLines(filePath: string): Promise<unknown[]> {
  if (!fs.existsSync(filePath)) return [];
  const results: unknown[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, "utf8"),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      results.push(JSON.parse(trimmed));
    } catch {
      // skip malformed lines
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// search_index.json shape emitted by MiniSearch in pipe-1
// ---------------------------------------------------------------------------

interface RawSearchIndex {
  /** MiniSearch serialised index has a documentCount field */
  documentCount?: number;
  /** pipe-1 also persists the raw docs array alongside the index */
  docs?: SearchIndexEntry[];
  /** Some builds store docs under "documents" */
  documents?: SearchIndexEntry[];
  /** Fallback: a plain array of documents */
  [key: string]: unknown;
}

function extractSearchDocs(raw: unknown): SearchIndexEntry[] {
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as RawSearchIndex;

  // Prefer explicit docs / documents arrays
  const candidates = obj.docs ?? obj.documents ?? null;
  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates as SearchIndexEntry[];
  }

  // MiniSearch v7 stores documents in a nested Map-like structure under "storedFields"
  // key: id, value: { file, tags, chunk_id, text? }
  if (obj["storedFields"] && typeof obj["storedFields"] === "object") {
    const storedFields = obj["storedFields"] as Record<
      string,
      SearchIndexEntry
    >;
    return Object.entries(storedFields).map(([id, fields]) => ({
      id,
      file: (fields as SearchIndexEntry).file ?? id,
      tags: (fields as SearchIndexEntry).tags ?? [],
      text: (fields as SearchIndexEntry).text,
    }));
  }

  return [];
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

export interface LoadResult {
  indexes: Phase1Indexes;
  warnings: string[];
}

export async function loadPhase1(phase1OutDir: string): Promise<LoadResult> {
  const warnings: string[] = [];
  const indexesDir = path.join(phase1OutDir, "indexes");

  if (!fs.existsSync(indexesDir)) {
    throw new Error(
      `Phase-1 indexes directory not found: ${indexesDir}\n` +
        `Make sure you pass the correct --phase1Out directory that contains an 'indexes/' sub-folder.`,
    );
  }

  console.log(`  [loadPhase1] Loading indexes from: ${indexesDir}`);

  // ── search_index.json ────────────────────────────────────────────────────
  const rawSearch = readJsonSync<unknown>(
    path.join(indexesDir, "search_index.json"),
  );
  const searchDocs = extractSearchDocs(rawSearch);
  if (searchDocs.length === 0) {
    warnings.push(
      "search_index.json absent or contained no documents – search-based seeding disabled.",
    );
  } else {
    console.log(`  [loadPhase1] search_index: ${searchDocs.length} docs`);
  }

  // ── symbol_index.json ────────────────────────────────────────────────────
  const symbolIndex: SymbolIndex =
    readJsonSync<SymbolIndex>(path.join(indexesDir, "symbol_index.json")) ?? {};
  if (Object.keys(symbolIndex).length === 0) {
    warnings.push(
      "symbol_index.json absent or empty – symbol-based seeding disabled.",
    );
  } else {
    console.log(
      `  [loadPhase1] symbol_index: ${Object.keys(symbolIndex).length} symbols`,
    );
  }

  // ── depgraph.json ────────────────────────────────────────────────────────
  const rawDep = readJsonSync<Partial<DepGraph>>(
    path.join(indexesDir, "depgraph.json"),
  );
  const depGraph: DepGraph = {
    adjacency: rawDep?.adjacency ?? {},
    reverseAdjacency: rawDep?.reverseAdjacency ?? {},
  };
  const fwdEdges = Object.values(depGraph.adjacency).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );
  if (fwdEdges === 0) {
    warnings.push("depgraph.json absent or empty – graph expansion disabled.");
  } else {
    console.log(
      `  [loadPhase1] depgraph: ${Object.keys(depGraph.adjacency).length} nodes, ${fwdEdges} forward edges`,
    );
  }

  // ── allFiles: try files.jsonl first, then derive from symbol / search index ─
  let allFiles: string[] = [];

  const filesJsonl = await readJsonlLines(path.join(indexesDir, "files.jsonl"));
  if (filesJsonl.length > 0) {
    allFiles = filesJsonl
      .map((row) => {
        if (typeof row === "string") return row;
        if (row && typeof row === "object" && "path" in row)
          return (row as { path: string }).path;
        return null;
      })
      .filter((p): p is string => typeof p === "string");
    console.log(`  [loadPhase1] files.jsonl: ${allFiles.length} files`);
  }

  if (allFiles.length === 0) {
    // Derive from other indexes
    const fromSymbols = [
      ...new Set(Object.values(symbolIndex).map((s) => s.file)),
    ];
    const fromSearch = [...new Set(searchDocs.map((d) => d.file))];
    const fromDep = [
      ...new Set([
        ...Object.keys(depGraph.adjacency),
        ...Object.keys(depGraph.reverseAdjacency),
      ]),
    ];
    allFiles = [...new Set([...fromSymbols, ...fromSearch, ...fromDep])];
    if (allFiles.length > 0) {
      console.log(
        `  [loadPhase1] allFiles derived from indexes: ${allFiles.length}`,
      );
      warnings.push(
        `files.jsonl not found. ${allFiles.length} file paths derived from other indexes.`,
      );
    }
  }

  // ── Supplement searchDocs from chunks.jsonl if docs were sparse ──────────
  if (searchDocs.length < 10) {
    const chunksJsonl = await readJsonlLines(
      path.join(indexesDir, "chunks.jsonl"),
    );
    if (chunksJsonl.length > 0) {
      for (const chunk of chunksJsonl) {
        if (
          chunk &&
          typeof chunk === "object" &&
          "file" in chunk &&
          "chunk_id" in chunk
        ) {
          const c = chunk as {
            chunk_id: string;
            file: string;
            tags?: string[];
            text?: string;
          };
          searchDocs.push({
            id: c.chunk_id,
            file: c.file,
            tags: c.tags ?? [],
            text: c.text,
          });
        }
      }
      console.log(
        `  [loadPhase1] chunks.jsonl supplemented search docs (now ${searchDocs.length})`,
      );
    }
  }

  return {
    indexes: {
      searchDocs,
      symbolIndex,
      depGraph,
      allFiles,
    },
    warnings,
  };
}
