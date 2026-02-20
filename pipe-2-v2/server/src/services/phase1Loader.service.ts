/**
 * phase1Loader.service.ts – Load and validate phase-1 output artefacts.
 *
 * Adapted from pipe-2/src/phase2/loadPhase1.ts for server usage.
 * Degrades gracefully when optional files are absent.
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
      `  [phase1Loader] Warning: could not parse ${filePath}: ${(err as Error).message}`,
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
  documentCount?: number;
  docs?: SearchIndexEntry[];
  documents?: SearchIndexEntry[];
  [key: string]: unknown;
}

function extractSearchDocs(raw: unknown): SearchIndexEntry[] {
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as RawSearchIndex;

  const candidates = obj.docs ?? obj.documents ?? null;
  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates as SearchIndexEntry[];
  }

  if (obj["storedFields"] && typeof obj["storedFields"] === "object") {
    const storedFields = obj["storedFields"] as Record<string, SearchIndexEntry>;
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
        `Make sure the phase1 run directory contains an 'indexes/' sub-folder.`,
    );
  }

  console.log(`  [phase1Loader] Loading indexes from: ${indexesDir}`);

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
    console.log(`  [phase1Loader] search_index: ${searchDocs.length} docs`);
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
      `  [phase1Loader] symbol_index: ${Object.keys(symbolIndex).length} symbols`,
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
      `  [phase1Loader] depgraph: ${Object.keys(depGraph.adjacency).length} nodes, ${fwdEdges} forward edges`,
    );
  }

  // ── allFiles: try files.jsonl first, then derive from other indexes ─────
  let allFiles: string[] = [];

  const filesJsonl = await readJsonlLines(path.join(indexesDir, "files.jsonl"));
  if (filesJsonl.length > 0) {
    allFiles = filesJsonl
      .map((row) => {
        if (typeof row === "string") return row;
        if (row && typeof row === "object" && "file" in row)
          return (row as { file: string }).file;
        if (row && typeof row === "object" && "path" in row)
          return (row as { path: string }).path;
        return null;
      })
      .filter((p): p is string => typeof p === "string");
    console.log(`  [phase1Loader] files.jsonl: ${allFiles.length} files`);
  }

  if (allFiles.length === 0) {
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
        `  [phase1Loader] allFiles derived from indexes: ${allFiles.length}`,
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
        `  [phase1Loader] chunks.jsonl supplemented search docs (now ${searchDocs.length})`,
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

// ---------------------------------------------------------------------------
// Project-DNA loaders (for context building)
// ---------------------------------------------------------------------------

export interface ProjectDNA {
  manifest: Record<string, unknown>;
  structure: Record<string, unknown>;
  conventions: Record<string, unknown>;
  apiContract: Record<string, unknown>;
  stateContract: Record<string, unknown>;
  hooksContract: Record<string, unknown>;
  tokens: Record<string, unknown>;
  rules: Record<string, unknown>;
}

export function loadProjectDNA(phase1OutDir: string): ProjectDNA {
  const dnaDir = path.join(phase1OutDir, "project-dna");

  return {
    manifest: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "manifest.json")) ?? {},
    structure: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "structure.json")) ?? {},
    conventions: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "conventions.json")) ?? {},
    apiContract: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "api-contract.json")) ?? {},
    stateContract: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "state-contract.json")) ?? {},
    hooksContract: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "hooks-contract.json")) ?? {},
    tokens: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "tokens.json")) ?? {},
    rules: readJsonSync<Record<string, unknown>>(path.join(dnaDir, "rules.json")) ?? {},
  };
}

// ---------------------------------------------------------------------------
// List available pipe-1 runs
// ---------------------------------------------------------------------------

export interface Phase1RunEntry {
  id: string;
  path: string;
  projectId: string;
  scannedAt: string;
}

export function listPhase1Runs(outDir: string): Phase1RunEntry[] {
  const pipe1Dir = path.join(outDir, "pipe-1");
  if (!fs.existsSync(pipe1Dir)) return [];

  const entries = fs.readdirSync(pipe1Dir, { withFileTypes: true });
  const runs: Phase1RunEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const runPath = path.join(pipe1Dir, entry.name);
    const manifestPath = path.join(runPath, "project-dna", "manifest.json");
    const manifest = readJsonSync<Record<string, unknown>>(manifestPath);

    runs.push({
      id: entry.name,
      path: runPath,
      projectId: (manifest?.projectId as string) ?? entry.name,
      scannedAt: ((manifest?.fingerprint as Record<string, unknown>)?.scannedAt as string) ?? "",
    });
  }

  return runs;
}
