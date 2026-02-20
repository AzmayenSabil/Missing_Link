# Missing_Link → pipe-1 (Phase 1)

## Project DNA Extraction — Technical Documentation

## 1) Purpose and Audience

This document explains the complete behavior of **pipe-1** (Phase 1 of Missing_Link), including architecture, stage-by-stage execution, generated artifacts, and grounding strategy.  
It is written for engineers, architects, and stakeholders who need to understand how the MVP converts a source repository into a machine-usable **Project DNA** package.

---

## 2) Scope of This Document

- Covers the implementation inside `pipe-1`.
- Covers one concrete generated run output:
  - `out/pipe-1/redx-admin-hub-1771431253020-20260218221415`
- Explains each generated file under:
  - `project-dna/`
  - `indexes/`
- Explains package choices, constraints (no DB/Docker), and token-efficiency strategy.

---

## 3) Run Snapshot (Documented Output)

From `project-dna/manifest.json` and `project-dna/qa_report.json`:

- **Project ID**: `redx-admin-hub-1771431253020-20260218221415`
- **Scanned files**: `99`
- **TS-like files parsed**: `84`
- **Exported symbols indexed**: `329`
- **Import rows indexed**: `258`
- **Tokens extracted**: `55`
- **READY_FOR_PHASE_2**: `true`
- **Detected stack signals**:
  - `react: true`
  - `typescript: true`
  - `antd: true`
  - `emotion: true`
  - `reduxToolkit: true`
  - `axios: true`

---

## 4) pipe-1 Architecture Overview

`pipe-1` is a **local, deterministic, filesystem-first extraction pipeline**.

### 4.1 Core principles

- **Static analysis over execution**: never runs target repo code.
- **JSON/JSONL outputs**: easy to inspect, diff, and pass to downstream phases.
- **Progressive grounding**: moves from broad inventory → symbols/dependencies → contracts/patterns → retrieval index → QA gate.
- **Best-effort resilience**: stage failures are captured as warnings and pipeline continues.

### 4.2 High-level flow

1. Intake repository and initialize context/output directories.
2. Detect stack + conventions.
3. Inventory file system structure.
4. Extract symbols/import graph.
5. Extract API contract.
6. Extract state and hooks contracts.
7. Extract tokens and architectural rules.
8. Mine patterns and concrete examples.
9. Build chunk corpus and MiniSearch index.
10. Write QA/readiness report.

---

## 5) pipe-1 Repository Structure and Responsibilities

## 5.1 Root files

### `package.json`

- **Responsibility**: Declares runtime dependencies, dev dependencies, scripts (`build`, `phase1`), and CLI entry (`dist/cli.js`).
- **Why it exists**: Defines packaging + execution contract.
- **Contribution**: Enables reproducible build/run of Phase 1.

### `tsconfig.json`

- **Responsibility**: TypeScript compiler options (`strict`, Node types, `rootDir/src`, `outDir/dist`).
- **Why it exists**: Guarantees consistent transpilation to Node-compatible output.
- **Contribution**: Keeps pipeline implementation type-safe and reliable.

### `README.md`

- **Responsibility**: Usage instructions and output layout for Phase 1.
- **Why it exists**: Developer onboarding and runbook.
- **Contribution**: Reduces operational mistakes and aligns users to expected outputs.

## 5.2 Source tree (`src/`)

### `src/cli.ts`

- **Responsibility**: Parses CLI args (`phase1`, `--repo`, `--git`, `--out`, `--projectId`) and invokes `runPhase1`.
- **Why it exists**: Stable command-line interface for users and automation.
- **Contribution**: Standardized entrypoint from terminal to pipeline engine.

### `src/pipeline/runPhase1.ts`

- **Responsibility**: Orchestrates all stages in fixed sequence and captures stage errors as warnings.
- **Why it exists**: Central execution controller.
- **Contribution**: Ensures deterministic stage order and single result contract.

### `src/pipeline/stages/index.ts`

- **Responsibility**: Re-export stage functions.
- **Why it exists**: Clean imports for orchestrator.
- **Contribution**: Improves maintainability of stage wiring.

### `src/pipeline/stages/intakeRepo.ts`

- **Responsibility**: Handles local path or git clone intake; initializes output dirs and `PipelineContext`.
- **Why it exists**: Normalizes input and bootstraps pipeline state.
- **Contribution**: Creates foundational context and filesystem targets.

### `src/pipeline/stages/discoverStack.ts`

- **Responsibility**: Detects stack/config signals and writes `manifest.json` + `conventions.json`.
- **Why it exists**: Captures environment/technology identity.
- **Contribution**: Early grounding constraints for downstream generation.

### `src/pipeline/stages/inventoryFilesAndStructure.ts`

- **Responsibility**: Builds structure summary and file inventory rows.
- **Why it exists**: Maps repository shape and role hints.
- **Contribution**: Prevents structural hallucination in later phases.

### `src/pipeline/stages/extractSymbolsAndDeps.ts`

- **Responsibility**: Uses `ts-morph` to extract exports/imports and build dependency graph + symbol index.
- **Why it exists**: Establishes code-level semantic map.
- **Contribution**: Primary grounding backbone for retrieval and reasoning.

### `src/pipeline/stages/extractApiContract.ts`

- **Responsibility**: Heuristically detects axios instances, service modules, endpoint literals.
- **Why it exists**: Captures backend integration surface.
- **Contribution**: Aligns generated code with real API patterns.

### `src/pipeline/stages/extractStateAndHooksContracts.ts`

- **Responsibility**: Detects Redux slices/store/persist usage and hook exports/import frequency.
- **Why it exists**: Captures state and hook architecture.
- **Contribution**: Prevents state-management drift in generated outputs.

### `src/pipeline/stages/extractTokensAndRules.ts`

- **Responsibility**: Extracts CSS custom properties and infers high-level rules.
- **Why it exists**: Captures styling tokens and architectural guardrails.
- **Contribution**: Preserves design consistency and wrapper conventions.

### `src/pipeline/stages/minePatternsAndExamples.ts`

- **Responsibility**: Finds representative snippets and writes pattern cards + markdown examples.
- **Why it exists**: Supplies concrete in-repo precedents.
- **Contribution**: Gives grounded exemplars to reduce speculative generation.

### `src/pipeline/stages/buildChunksAndSearchIndex.ts`

- **Responsibility**: Builds chunk corpus and serialized MiniSearch index.
- **Why it exists**: Enables low-latency retrieval for targeted context packs.
- **Contribution**: Token-efficient retrieval rather than full-DNA prompting.

### `src/pipeline/stages/writeQaReport.ts`

- **Responsibility**: Computes metrics/signals and emits readiness gate.
- **Why it exists**: Objective quality/checkpoint report.
- **Contribution**: Decides if artifacts are sufficient for next phase.

### `src/types/pipeline.ts`

- **Responsibility**: Shared contracts (`PipelineContext`, records, metrics).
- **Why it exists**: Strong typing across stages.
- **Contribution**: Reduces integration mistakes and schema drift.

### `src/utils/fs.ts`

- **Responsibility**: Safe I/O helpers (`writeJson`, `writeJsonl`, `readTextSafe`, etc.).
- **Why it exists**: Consistent and resilient filesystem operations.
- **Contribution**: Reliable artifact persistence and bounded reads.

### `src/utils/paths.ts`

- **Responsibility**: Path normalization, relative mapping, project ID sanitation/derivation.
- **Why it exists**: Cross-platform path consistency.
- **Contribution**: Stable identifiers and portable path references.

### `src/utils/snippets.ts`

- **Responsibility**: Snippet extraction by range/index with size bounds.
- **Why it exists**: Reusable snippet extraction logic.
- **Contribution**: Produces concise, relevant example/chunk content.

---

## 6) Package Choices and Rationale

## 6.1 `ts-morph`

- **Why chosen**: High-level TypeScript AST API with practical export/import introspection.
- **Problem solved**: Reliable symbol extraction, declaration line mapping, import graph assembly.
- **MVP fit**: Faster and safer than ad-hoc regex parsing for semantic structure.

## 6.2 `fast-glob`

- **Why chosen**: Fast recursive file discovery with ignore patterns.
- **Problem solved**: Efficient repository inventory and scoped file selection.
- **MVP fit**: Simple, battle-tested, no infrastructure overhead.

## 6.3 `minisearch`

- **Why chosen**: Lightweight in-process full-text index with serialization.
- **Problem solved**: Retrieval over chunk corpus without external search service.
- **MVP fit**: Enables portable local retrieval (`search_index.json`) and low setup cost.

## 6.4 `simple-git`

- **Why chosen**: Thin wrapper over git commands.
- **Problem solved**: Clone remote repositories and read commit head safely.
- **MVP fit**: Minimal abstraction for deterministic git intake.

## 6.5 `postcss` (if used)

- **Current status in pipe-1**: **Not used by pipe-1 implementation** (not in dependencies).
- **Observed in scanned repo**: `postcss.config.js` appears as an analyzed file artifact.
- **Why this matters**: pipe-1 currently extracts tokens via regex from CSS-like files; PostCSS parsing is a possible future enhancement, not an MVP requirement.

## 6.6 `typescript`

- **Why chosen**: Type-safe implementation and compilation to Node runtime.
- **Problem solved**: Compile-time safety, maintainable stage contracts, stricter refactors.
- **MVP fit**: Improves reliability for multi-stage data pipeline.

## 6.7 `@types/node`

- **Why chosen**: Node type definitions for fs/path/process APIs.
- **Problem solved**: Accurate type checking/autocomplete on Node runtime primitives.
- **MVP fit**: Essential for strict TypeScript on Node CLI project.

---

## 7) Why No Database / Docker / External Services (MVP Decision)

### 7.1 Why no database

- Artifacts are immutable-ish run outputs naturally represented as files.
- JSON/JSONL supports versioning, diffing, and cheap transport between phases.
- Avoids schema migration and operational complexity at MVP stage.

### 7.2 Why no Docker

- Local-first usage expected for rapid iteration.
- Reduces setup friction (no container build/runtime dependency).
- Keeps onboarding simple for engineers validating extraction behavior.

### 7.3 Why JSON-only architecture

- Human-readable and machine-consumable.
- Easy to merge, inspect, validate, and cache by file.
- Works well for retrieval pipelines (JSONL rows, serialized search index).

---

## 8) Full Execution Flow (Stage-by-Stage)

## 8.1 `intakeRepo()`

- **Reads**: CLI options (`repoPath`/`gitUrl`, optional `outDir`, `projectId`).
- **Writes**: Directory scaffolding (`project-dna/`, `indexes/`, `examples/`) and initialized in-memory `PipelineContext`.
- **Why it matters**: Establishes deterministic run environment and file boundaries.
- **Grounding contribution**: Defines canonical repo root + output scope, preventing path ambiguity.

## 8.2 `discoverStack()`

- **Reads**: `package.json`, presence/config files (`tsconfig`, eslint, prettier, commitlint), git HEAD.
- **Writes**: `project-dna/manifest.json`, `project-dna/conventions.json`.
- **Why it matters**: Captures technology and coding standard signals.
- **Grounding contribution**: Constrains later generation to detected stack/tooling.

## 8.3 `inventoryFilesAndStructure()`

- **Reads**: `ctx.allFiles` list from intake.
- **Writes**: `project-dna/structure.json`, `indexes/files.jsonl`.
- **Why it matters**: Converts raw file list into navigable structure metadata.
- **Grounding contribution**: Keeps generated outputs aligned with real folder topology.

## 8.4 `extractSymbolsAndDeps()`

- **Reads**: TS/JS source files via `ts-morph`.
- **Writes**: `indexes/exports.jsonl`, `indexes/imports.jsonl`, `indexes/depgraph.json`, `indexes/symbol_index.json`; updates context exports/imports/hookExports.
- **Why it matters**: Produces semantic code map (symbols + dependency graph).
- **Grounding contribution**: Prevents invented symbols and wrong module wiring.

## 8.5 `extractApiContract()`

- **Reads**: TS/JS file text heuristics for axios/service/endpoints.
- **Writes**: `project-dna/api-contract.json`.
- **Why it matters**: Documents service layer and HTTP interaction shape.
- **Grounding contribution**: Keeps generated API calls consistent with existing patterns.

## 8.6 `extractStateAndHooksContracts()`

- **Reads**: TS/JS file text + `ctx.hookExports` + `ctx.imports`.
- **Writes**: `project-dna/state-contract.json`, `project-dna/hooks-contract.json`.
- **Why it matters**: Models Redux and hook ecosystem.
- **Grounding contribution**: Aligns code generation with store, slices, and common hook usage.

## 8.7 `extractTokensAndRules()`

- **Reads**: CSS-like files + selected manifest signals.
- **Writes**: `project-dna/tokens.json`, `project-dna/rules.json`.
- **Why it matters**: Extracts style tokens and inferred architectural rules.
- **Grounding contribution**: Reduces UI inconsistency and wrapper convention drift.

## 8.8 `minePatternsAndExamples()`

- **Reads**: TS/JS file content.
- **Writes**: `project-dna/pattern-cards.json`, `project-dna/examples/*.md`.
- **Why it matters**: Captures concrete snippet-level precedents from real code.
- **Grounding contribution**: Gives LLM exemplar context instead of abstract-only rules.

## 8.9 `buildChunksAndSearchIndex()`

- **Reads**: `ctx.exports` + source file text.
- **Writes**: `indexes/chunks.jsonl`, `indexes/search_index.json`.
- **Why it matters**: Builds retrieval substrate over bounded, relevant snippets.
- **Grounding contribution**: Enables focused retrieval and token-efficient grounding.

## 8.10 `writeQaReport()`

- **Reads**: metrics, tags, warnings, depgraph completeness.
- **Writes**: `project-dna/qa_report.json`; sets readiness flag.
- **Why it matters**: Quantifies extraction coverage and confidence.
- **Grounding contribution**: Gates downstream phases based on objective signals.

---

## 9) Generated Artifact Documentation (Project DNA + Indexes)

## 9.1 `project-dna/manifest.json`

- **Contains**: `projectId`, `repoPath`, `stack`, `configs`, `fingerprint`.
- **Generated by**: `discoverStack()`.
- **Why exists**: Run identity + environment capability snapshot.
- **Used by later phases**: bootstrap constraints for framework/library-aware generation.
- **Anti-hallucination role**: Prevents assuming unsupported stack/tools.

## 9.2 `project-dna/structure.json`

- **Contains**: `totalFiles`, `topLevelEntries`, `extensionCounts`, `folderRoles`, `sampleFiles`.
- **Generated by**: `inventoryFilesAndStructure()`.
- **Why exists**: Structural map of codebase layout and inferred domain folders.
- **Used by later phases**: task scoping, file-target planning, path-aware prompts.
- **Anti-hallucination role**: Discourages creating files in non-existent patterns.

## 9.3 `project-dna/conventions.json`

- **Contains**: presence + parsed/snippet metadata for prettier/eslint/commitlint configs.
- **Generated by**: `discoverStack()`.
- **Why exists**: Captures style/lint conventions.
- **Used by later phases**: output formatting/lint compatibility guidance.
- **Anti-hallucination role**: Limits style assumptions unsupported by repo config.

## 9.4 `project-dna/tokens.json`

- **Contains**:
  - `tokens[]` entries: `{ name, value, file }`
  - `themeCandidates[]` paths
- **Generated by**: `extractTokensAndRules()`.
- **Why exists**: Design token inventory and theming signal.
- **Used by later phases**: styling-aware generation and token reuse.
- **Anti-hallucination role**: Prevents arbitrary colors/theme APIs.

## 9.5 `project-dna/rules.json`

- **Contains**: `rules[]` inferred high-level conventions.
- **Generated by**: `extractTokensAndRules()`.
- **Why exists**: Explicit guidance from inferred architectural patterns.
- **Used by later phases**: instruction constraints in generation prompts.
- **Anti-hallucination role**: Reduces policy drift (e.g., wrapper/component conventions).

## 9.6 `project-dna/api-contract.json`

- **Contains**:
  - `axiosInstances[]` (`file`, `variableName`, `baseURL`, interceptors)
  - `serviceModules[]`
  - `endpointLiterals[]` (`method`, `path`, `line`)
  - `summary`
- **Generated by**: `extractApiContract()`.
- **Why exists**: Canonical API integration summary.
- **Used by later phases**: endpoint/service reuse and API-layer extension.
- **Anti-hallucination role**: Prevents fake clients/endpoints.

## 9.7 `project-dna/state-contract.json`

- **Contains**: `sliceFiles[]`, `thunkNames[]`, `storeFiles[]`, `reduxPersistUsage[]`.
- **Generated by**: `extractStateAndHooksContracts()`.
- **Why exists**: State architecture inventory.
- **Used by later phases**: state update tasks, store/slice alignment.
- **Anti-hallucination role**: Prevents wrong state patterns and duplicate stores.

## 9.8 `project-dna/hooks-contract.json`

- **Contains**:
  - `hookExports[]` (`hook`, `file`)
  - `mostImportedHooks[]` (`hook`, `count`)
- **Generated by**: `extractStateAndHooksContracts()`.
- **Why exists**: Hook ecosystem map + adoption frequency.
- **Used by later phases**: prefer existing hooks over new redundant ones.
- **Anti-hallucination role**: Reduces custom-hook reinvention.

## 9.9 `project-dna/pattern-cards.json`

- **Contains**: array of pattern detections with snippet metadata (`file`, `startLine`, `endLine`, `snippet`, `found`).
- **Generated by**: `minePatternsAndExamples()`.
- **Why exists**: Machine-readable pattern exemplars.
- **Used by later phases**: retrieval/ranking of examples per task intent.
- **Anti-hallucination role**: Anchors generated code to proven local patterns.

## 9.10 `project-dna/examples/*.md`

- **Contains**: human-readable examples for:
  - `authorize-page.md`
  - `service-layer.md`
  - `redux-slice.md`
  - `hook-usage.md`
  - `styling.md`
- **Generated by**: `minePatternsAndExamples()`.
- **Why exists**: Curated snippets for reviewers and prompt attachments.
- **Used by later phases**: optional contextual supplements and explainability.
- **Anti-hallucination role**: Demonstrates exact local implementation style.

## 9.11 `project-dna/qa_report.json`

- **Contains**: `counts`, `detected`, `warnings`, `readiness.READY_FOR_PHASE_2`.
- **Generated by**: `writeQaReport()`.
- **Why exists**: quality gate and extraction health summary.
- **Used by later phases**: go/no-go and confidence weighting.
- **Anti-hallucination role**: prevents over-trusting low-signal extractions.

## 9.12 `indexes/files.jsonl`

- **Contains (per row)**: `{ file, ext, top }`.
- **Generated by**: `inventoryFilesAndStructure()`.
- **Why exists**: normalized file inventory for cheap filtering.
- **Used by later phases**: quick lookup/scoping before deep retrieval.
- **Anti-hallucination role**: guards against referencing nonexistent files.

## 9.13 `indexes/exports.jsonl`

- **Contains (per row)**: `{ symbol, kind, file, tags, startLine, endLine }`.
- **Generated by**: `extractSymbolsAndDeps()`.
- **Why exists**: symbol export table with location + semantic tags.
- **Used by later phases**: symbol resolution and snippet targeting.
- **Anti-hallucination role**: avoids invented exports and wrong symbol kinds.

## 9.14 `indexes/imports.jsonl`

- **Contains (per row)**: `{ file, moduleSpecifier, resolvedFile?, importedSymbols[] }`.
- **Generated by**: `extractSymbolsAndDeps()`.
- **Why exists**: import linkage and dependency usage hints.
- **Used by later phases**: impact analysis and module wiring.
- **Anti-hallucination role**: prevents impossible import paths.

## 9.15 `indexes/depgraph.json`

- **Contains**:
  - `adjacency: Record<file, file[]>`
  - `reverseAdjacency: Record<file, file[]>`
- **Generated by**: `extractSymbolsAndDeps()`.
- **Why exists**: explicit file-level dependency graph.
- **Used by later phases**: change impact traversal, context neighborhood expansion.
- **Anti-hallucination role**: prevents architectural jumps that violate real dependencies.

## 9.16 `indexes/symbol_index.json`

- **Contains**: `Record<symbol, { file, kind, tags[] }>`.
- **Generated by**: `extractSymbolsAndDeps()`.
- **Why exists**: direct symbol-to-definition lookup table.
- **Used by later phases**: fast grounding for symbol mentions in prompts/tasks.
- **Anti-hallucination role**: prevents symbol-location mismatches.

## 9.17 `indexes/chunks.jsonl`

- **Contains (per row)**: `{ chunk_id, file, tags[], text }`.
- **Generated by**: `buildChunksAndSearchIndex()`.
- **Why exists**: retrieval-ready chunk corpus with semantic tags.
- **Used by later phases**: context pack assembly for specific tasks.
- **Anti-hallucination role**: prompts are grounded in concrete source snippets.

## 9.18 `indexes/search_index.json`

- **Contains** (MiniSearch serialized form):
  - `documentCount`, `nextId`, `documentIds`, `fieldIds`, `fieldLength`, `averageFieldLength`, `storedFields`, `dirtCount`, `index`, `serializationVersion`
- **Generated by**: `buildChunksAndSearchIndex()`.
- **Why exists**: portable prebuilt text index for low-latency retrieval.
- **Used by later phases**: query-time ranking of relevant chunks.
- **Anti-hallucination role**: retrieval is data-driven, not memory-driven.

---

## 10) Dependency Graph Model (Grounding Backbone)

## 10.1 Node types

The current MVP directly models files and symbols, then uses tags/contracts to infer higher-level entities:

- `file`
- `component` (tagged exports)
- `hook` (tagged exports)
- `slice` (Redux slice detections)
- `service` (API/service detections)
- `token` (design token detections)

## 10.2 Edge types

- **Implemented in MVP output**:
  - `imports` / `depends_on` (from `imports.jsonl` + `depgraph.json`)
- **Representable/derivable for next phases**:
  - `uses` (component/hook/symbol usage)
  - `dispatches` (Redux action dispatch paths)
  - `calls_api` (service/API invocation paths)

## 10.3 Why this is the grounding backbone

- Provides explicit neighborhood traversal for context retrieval.
- Enables impact-aware generation (where to edit and why).
- Prevents disconnected code suggestions that violate existing architecture.

---

## 11) Token Efficiency Strategy

## 11.1 Why not send entire DNA to LLM

- Full artifacts can be large (e.g., large `search_index.json`, many chunks/exports).
- Full prompt stuffing increases latency/cost and can degrade answer focus.

## 11.2 Runtime Context Pack

- A compact bundle prepared at request time from:
  - manifest/stack constraints
  - relevant rules/tokens
  - dependency-neighbor files
- Purpose: provide minimal high-signal architecture context.

## 11.3 Task Context Pack

- Task-specific augmentation from retrieval:
  - top-ranked chunks
  - related exports/imports
  - matching pattern cards/examples
- Purpose: provide just enough evidence for the current task.

## 11.4 Retrieval using MiniSearch

- Query over `chunks.jsonl` via `search_index.json`.
- Rank by textual relevance + tags/file proximity.
- Return only top-N chunks for prompt inclusion.

## 11.5 Net effect on token usage

- Reduces context size while increasing relevance density.
- Improves determinism and groundedness.
- Makes multi-step generation economically practical.

---

## 12) How Artifacts Prevent Hallucination and Drift

- **Stack/config grounding**: blocks unsupported framework/tool assumptions.
- **Structure grounding**: anchors path and folder expectations to reality.
- **Symbol/dependency grounding**: enforces real imports/exports and graph edges.
- **Contract grounding**: aligns API/state/hooks behavior with existing patterns.
- **Example grounding**: injects concrete snippets instead of abstract instructions.
- **Retrieval grounding**: sends only relevant, source-derived chunks to LLM.
- **QA gate**: validates extraction sufficiency before downstream generation.

---

## 13) Summary

Phase 1 (`pipe-1`) is a deterministic Project DNA extraction pipeline that converts a repository into a structured, retrieval-ready grounding package.  
Its JSON/JSONL artifacts form the contract for downstream phases to generate changes with high architectural fidelity, lower token cost, and reduced hallucination risk.
