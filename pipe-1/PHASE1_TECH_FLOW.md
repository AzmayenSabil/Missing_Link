# Phase 1 — Technical Flow

Phase 1 is the **Repo Intelligence** pipeline. It takes a source repository (local path or Git URL) and produces a structured "project DNA" output that downstream phases consume to understand the codebase before generating code.

---

## Entry Point

```
missing-link phase1 --repo <path> [--out <dir>] [--projectId <id>]
missing-link phase1 --git <url>  [--out <dir>] [--projectId <id>]
```

`cli.ts` parses CLI arguments and delegates to `runPhase1()`.

---

## Pipeline Orchestration (`runPhase1.ts`)

`runPhase1` runs in two parts:

1. **Bootstrap** — calls `intakeRepo()` to set up the `PipelineContext`.
2. **Sequential stages** — iterates through an ordered list of stage functions, each mutating/extending the shared context. Stage failures are caught and added to `ctx.warnings` (non-fatal).

```
intakeRepo()
    ↓
discoverStack
    ↓
inventoryFilesAndStructure
    ↓
extractSymbolsAndDeps
    ↓
extractApiContract
    ↓
extractStateAndHooksContracts
    ↓
extractTokensAndRules
    ↓
minePatternsAndExamples
    ↓
buildChunksAndSearchIndex
    ↓
writeQaReport
```

The final result surfaces `projectOutDir`, `readyForPhase2`, `entryPoints`, and `warnings`.

---

## Stage-by-Stage Breakdown

### Stage 0 — `intakeRepo` (bootstrap, not in the loop)

| Input                        | Action                                                                       | Output                                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| `--repo` path or `--git` URL | Clones repo to temp dir if git URL given                                     | Resolved `workingRepoPath`                                |
| repo path                    | `fast-glob` scans all files (excludes `node_modules`, `.git`, `dist`, `out`) | `ctx.allFiles[]`, `ctx.tsLikeFiles[]`                     |
| —                            | Creates output directory tree                                                | `projectOutDir/`, `project-dna/`, `examples/`, `indexes/` |
| —                            | Initialises `PipelineContext` with empty metrics/arrays                      | Shared `ctx` object injected into every stage             |

Project ID is derived from the repo folder name + timestamp (or overridden via `--projectId`).

---

### Stage 1 — `discoverStack`

**Purpose:** Fingerprint the repo's technology stack and tooling conventions.

| What it inspects    | How                                                                                      | Written artifacts                       |
| ------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| `package.json` deps | Presence checks for Next.js, React, TypeScript, antd, emotion, Redux Toolkit, SWR, axios | `project-dna/manifest.json`             |
| Config files        | Detects `tsconfig.json`, `.eslintrc*`, `.prettierrc*`, `commitlint.config.*`             | `project-dna/conventions.json`          |
| Git                 | Reads current HEAD SHA via `simple-git`                                                  | included in `manifest.json` fingerprint |

`manifest.json` schema:

```
{ projectId, repoPath, stack{}, configs{}, fingerprint{ scannedAt, totalFiles, tsLikeFiles, gitHead } }
```

---

### Stage 2 — `inventoryFilesAndStructure`

**Purpose:** Build a structural map of the repo.

- Counts files per extension (`extensionCounts`).
- Counts files per top-level directory (`topLevelEntries`).
- Infers folder roles from path keywords:

| Keyword pattern               | Inferred role |
| ----------------------------- | ------------- |
| `pages` / `app`               | `routing`     |
| `components`                  | `ui`          |
| `hooks`                       | `hooks`       |
| `services` / `api`            | `api`         |
| `redux` / `store`             | `state`       |
| `assets` / `styles` / `theme` | `theme`       |
| `config`                      | `config`      |
| `types`                       | `types`       |

**Written artifacts:**

- `project-dna/structure.json` — totals, top-level map, extension breakdowns, folder roles, first 500 file paths
- `indexes/files.jsonl` — one row per file: `{ file, ext, top }`

---

### Stage 3 — `extractSymbolsAndDeps`

**Purpose:** Parse every TypeScript/JavaScript file and extract all exported symbols and their dependency relationships.

Uses **ts-morph** (TypeScript compiler API) to perform static analysis.

#### Symbol extraction

For each exported declaration it captures:

- `symbol` — export name
- `kind` — TS node kind (FunctionDeclaration, VariableDeclaration, etc.)
- `file` — repo-relative path
- `startLine` / `endLine`
- `tags` — auto-detected classification:

| Tag         | Detection rule                                  |
| ----------- | ----------------------------------------------- |
| `hook`      | Symbol name starts with `use[A-Z]`              |
| `slice`     | File contains `createSlice(`                    |
| `thunk`     | File contains `createAsyncThunk(`               |
| `service`   | File in `/services/` or uses axios/HTTP methods |
| `component` | `.tsx` file, PascalCase name or JSX present     |
| `other`     | None of the above                               |

#### Dependency graph

For each import declaration it resolves relative specifiers to actual repo-relative paths and builds:

- **adjacency** — `file → [imported files]`
- **reverseAdjacency** — `file → [files that import it]`

External/npm imports are recorded but not resolved in the graph.

**Written artifacts:**

- `indexes/exports.jsonl`
- `indexes/imports.jsonl`
- `indexes/depgraph.json`

**Context mutations:** `ctx.exports`, `ctx.imports`, `ctx.depgraph`, `ctx.symbolIndex`, `ctx.hookExports`, `ctx.metrics`

---

### Stage 4 — `extractApiContract`

**Purpose:** Map all HTTP API surface—axios instances, interceptors, and endpoint literals.

Scans via regex without full AST parsing (faster, resilient to any JS/TS dialect):

| Pattern                                                 | What it captures                                              |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `axios.create({ baseURL: '...' })`                      | Axios instance, variable name, base URL, interceptor presence |
| `.get\|.post\|.put\|.patch\|.delete('...')`             | Method + URL literal                                          |
| Files in `/services/` or `/api/` that export + use HTTP | Service module catalogue                                      |

First service/axios file found sets `ctx.entryPoints.api`.

**Written artifact:** `project-dna/api-contract.json`

```
{ axiosInstances[], serviceModules[], endpointLiterals[], summary{} }
```

---

### Stage 5 — `extractStateAndHooksContracts`

**Purpose:** Catalogue Redux state shape and the hook API surface.

#### State contract

| Detected pattern | How                                                 |
| ---------------- | --------------------------------------------------- |
| Redux slices     | `createSlice(` + slice `name:` extraction           |
| Async thunks     | `createAsyncThunk(` + variable name                 |
| Store setup      | `configureStore(` — sets `ctx.entryPoints.store`    |
| Redux Persist    | `redux-persist` / `persistReducer` / `persistStore` |

#### Hooks contract

- Lists all hook exports captured in stage 3 (`ctx.hookExports`).
- Counts how many times each `use*` symbol appears on the import side across the whole codebase → `mostImportedHooks` (top 25).

**Written artifacts:**

- `project-dna/state-contract.json`
- `project-dna/hooks-contract.json`

---

### Stage 6 — `extractTokensAndRules`

**Purpose:** Extract design tokens and derive high-level coding rules.

- Scans all `*.css / *.scss / *.sass / *.less` files for CSS custom property declarations (`--token-name: value;`).
- Collects theme candidate paths (files with `theme|token|style` in their name).
- Infers rules:
  - If tokens found → `"Do not use hex colors directly; use design tokens."` (and sets `ctx.entryPoints.theme`).
  - If an `Authorize`-named file exists → `"Pages should wrap route content with Authorize..."`.
  - If `antd: true` in manifest → `"Prefer Ant Design components..."`.

**Written artifacts:**

- `project-dna/tokens.json` — `{ tokens[], themeCandidates[] }`
- `project-dna/rules.json` — `{ rules[] }`

---

### Stage 7 — `minePatternsAndExamples`

**Purpose:** Pull real code snippets from the repo to serve as canonical examples for code generation.

Searches for 5 patterns using targeted regex scans:

| Pattern               | Search criteria                                           |
| --------------------- | --------------------------------------------------------- |
| **Authorize wrapper** | In a `pages/` or `app/` file, uses `\bAuthorize\b`        |
| **useTable hook**     | Any file uses `\buseTable\b`                              |
| **Service layer**     | File in `services/`/`api/`, uses axios/HTTP methods       |
| **Redux slice**       | Any file uses `createSlice(`                              |
| **Styling**           | Any file uses `@emotion`, `styled(`, `:root`, or CSS vars |

Each found pattern is extracted as a 30-line window around the match (`getSnippetAroundIndex`).

Sets `ctx.entryPoints.authorize` from the Authorize page example.

**Written artifacts:**

- `project-dna/pattern-cards.json` — structured list of all 5 pattern results
- `project-dna/examples/authorize-page.md`
- `project-dna/examples/service-layer.md`
- `project-dna/examples/redux-slice.md`
- `project-dna/examples/hook-usage.md`
- `project-dna/examples/styling.md`

---

### Stage 8 — `buildChunksAndSearchIndex`

**Purpose:** Create a full-text searchable index of all exported code, for use by Phase 2's AI retrieval.

#### Chunking

- One chunk per exported symbol from `ctx.exports`.
- Snippet = source lines from `startLine` to `endLine`, capped at **80 lines**.
- If no exports were found, falls back to chunking whole file contents (first 200 files, 20 KB limit each).

#### Search index

Built with **MiniSearch** (in-memory, serialisable):

- Indexed fields: `text`, `file`, `tags`
- Stored fields: `chunk_id`, `file`, `tags`
- Search options: prefix matching + fuzzy distance `0.1`

**Written artifacts:**

- `indexes/chunks.jsonl` — `{ chunk_id, file, tags[], text }`
- `indexes/search_index.json` — serialised MiniSearch index

---

### Stage 9 — `writeQaReport`

**Purpose:** Validate pipeline completeness and decide readiness for Phase 2.

Counts tag distribution from `ctx.exports`:

- `hooks`, `components`, `services`, `slices`

Readiness check (`READY_FOR_PHASE_2 = true` when):

- `depgraph.adjacency` is non-empty, **AND**
- At least one of: `exports_count > 20`, hooks > 0, components > 0, services > 0, slices > 0

Sets `ctx.readyForPhase2` which is returned to the CLI caller.

**Written artifact:** `project-dna/qa_report.json`

```json
{
  "counts": { "files_scanned", "ts_files_parsed", "exports_count", "imports_edges_count", "tokens_count" },
  "detected": { "hooks", "components", "services", "slices" },
  "warnings": [],
  "readiness": { "READY_FOR_PHASE_2": true }
}
```

---

## Output Directory Layout

```
out/pipe-1/<projectId>/
│
├── project-dna/                   ← semantic DNA of the codebase
│   ├── manifest.json              ← stack flags + config presence + git fingerprint
│   ├── conventions.json           ← raw prettier/eslint/commitlint configs
│   ├── structure.json             ← file counts, folder roles, extension map
│   ├── api-contract.json          ← axios instances, service modules, endpoint literals
│   ├── state-contract.json        ← Redux slices, thunks, store files, persist usage
│   ├── hooks-contract.json        ← exported hooks + most-imported hooks ranking
│   ├── tokens.json                ← CSS design tokens + theme file candidates
│   ├── rules.json                 ← inferred global coding rules
│   ├── pattern-cards.json         ← 5 canonical code patterns (structured)
│   ├── qa_report.json             ← pipeline metrics + READY_FOR_PHASE_2 flag
│   │
│   └── examples/                  ← human-readable example snippets
│       ├── authorize-page.md
│       ├── service-layer.md
│       ├── redux-slice.md
│       ├── hook-usage.md
│       └── styling.md
│
└── indexes/                       ← machine-queryable indexes
    ├── files.jsonl                ← every file: { file, ext, top }
    ├── exports.jsonl              ← every export: { symbol, kind, file, tags, lines }
    ├── imports.jsonl              ← every import edge: { file, moduleSpecifier, resolved, symbols }
    ├── depgraph.json              ← { adjacency{}, reverseAdjacency{} }
    ├── chunks.jsonl               ← code chunks for retrieval: { chunk_id, file, tags, text }
    └── search_index.json          ← serialised MiniSearch full-text index
```

> **Note:** `symbol_index.json` is held in memory as `ctx.symbolIndex` but is not separately written to disk in the current implementation — it is used internally by downstream stages.

---

## Shared Context (`PipelineContext`)

The single `PipelineContext` object threads through every stage. Key fields and which stage populates them:

| Field                   | Type                              | Populated by                    |
| ----------------------- | --------------------------------- | ------------------------------- |
| `allFiles`              | `string[]`                        | `intakeRepo`                    |
| `tsLikeFiles`           | `string[]`                        | `intakeRepo`                    |
| `exports`               | `ExportRecord[]`                  | `extractSymbolsAndDeps`         |
| `imports`               | `ImportRecord[]`                  | `extractSymbolsAndDeps`         |
| `depgraph`              | `{ adjacency, reverseAdjacency }` | `extractSymbolsAndDeps`         |
| `symbolIndex`           | `Record<string, …>`               | `extractSymbolsAndDeps`         |
| `hookExports`           | `ExportRecord[]`                  | `extractSymbolsAndDeps`         |
| `tokens`                | `Array<{name,value,file}>`        | `extractTokensAndRules`         |
| `entryPoints.api`       | `string?`                         | `extractApiContract`            |
| `entryPoints.store`     | `string?`                         | `extractStateAndHooksContracts` |
| `entryPoints.theme`     | `string?`                         | `extractTokensAndRules`         |
| `entryPoints.authorize` | `string?`                         | `minePatternsAndExamples`       |
| `metrics`               | `PipelineMetrics`                 | mutated across stages           |
| `warnings`              | `string[]`                        | accumulated across all stages   |
| `readyForPhase2`        | `boolean`                         | `writeQaReport`                 |

---

## Real-World Run (redx-admin-hub)

From the actual output in `out/pipe-1/redx-admin-hub-*/project-dna/qa_report.json`:

| Metric                | Value    |
| --------------------- | -------- |
| Files scanned         | 99       |
| TS/JS files parsed    | 84       |
| Exports extracted     | 329      |
| Import edges          | 258      |
| CSS tokens            | 55       |
| Hooks detected        | 6        |
| Components detected   | 291      |
| Services detected     | 7        |
| Redux slices          | 3        |
| Warnings              | 0        |
| **READY_FOR_PHASE_2** | **true** |

---

## Error Handling

- Each stage runs inside a `try/catch` in the orchestrator loop.
- Failures append to `ctx.warnings` rather than aborting the pipeline.
- The QA report surfaces all accumulated warnings.
- Only `intakeRepo` is fatal — if it throws, the pipeline never starts.
