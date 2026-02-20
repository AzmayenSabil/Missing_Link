# missing-link · pipe-1 / Phase 1

`missing-link` generates a deterministic, JSON-only **Project DNA** bundle from a local
repository path or a remote git URL. It is the foundation for downstream AI phases that
analyse PRDs, plan architecture, and generate code.

## Constraints

- Local-only execution
- No Docker, no external databases
- Filesystem outputs only (`JSON` / `JSONL`)
- Never executes untrusted repository code
- All static-analysis stages are LLM-free
- Optional GPT-4o-mini call at the very end (controllable via env var)

---

## Install

```bash
cd pipe-1
npm install
npm run build
```

---

## Environment setup

Copy the example env file and fill in your OpenAI API key if you want system-prompt
generation (optional — all static-analysis stages run without it):

```bash
cp .env.example .env
# then open .env and set OPENAI_API_KEY=sk-...
```

`.env` is `.gitignore`d — never commit real keys.

---

## Run

### Local repo path

```bash
npm run phase1 -- --repo <path>
```

### Git URL intake

```bash
npm run phase1 -- --git <url>
```

### With system-prompt generation

```bash
# via .env (recommended)
OPENAI_API_KEY=sk-... npm run phase1 -- --git <url>

# or via CLI flag
npm run phase1 -- --git <url> --openai-key sk-...
```

### All options

| Flag                 | Description                                     | Default                            |
| -------------------- | ----------------------------------------------- | ---------------------------------- |
| `--repo <path>`      | Analyse a local directory                       | —                                  |
| `--git <url>`        | Clone and analyse a remote repo                 | —                                  |
| `--out <dir>`        | Output root directory                           | `../out/pipe-1`                    |
| `--projectId <id>`   | Explicit project identifier                     | derived from repo name + timestamp |
| `--openai-key <key>` | OpenAI API key (overrides `OPENAI_API_KEY` env) | —                                  |

If both `--repo` and `--git` are supplied, `--repo` takes precedence.

---

## Output structure

All outputs are written under `<out>/<project_id>/`.

```
<project_id>/
  project-dna/
    manifest.json              Stack + config flags + git fingerprint
    conventions.json           Raw prettier / eslint / commitlint presence
    structure.json             File counts, folder roles, top-level tree
    api-contract.json          Axios endpoints + base-URL detection
    state-contract.json        Redux slices, thunks, store file locations
    hooks-contract.json        Exported hooks + most-imported hooks
    tokens.json                Design tokens (CSS variables, theme values)
    rules.json                 Extracted ESLint / coding rules
    pattern-cards.json         5 canonical code patterns with examples
    style-contract.json        Normalized tsconfig + eslint + prettier values
    module-resolution.json     Path aliases, baseUrl, alias-usage detection
    naming-conventions.json    File / component / hook naming style inference
    architecture-boundaries.json  Role-to-role dependency matrix + violations
    state-style.json           Typed hooks, useSelector counts, store location
    qa_report.json             Coverage metrics + READY_FOR_PHASE_2 flag
    system-prompts.json        ⚡ LLM-generated system instructions (optional)
    examples/
      authorize-page.md
      service-layer.md
      redux-slice.md
      hook-usage.md
      styling.md

  indexes/
    files.jsonl
    exports.jsonl
    imports.jsonl
    depgraph.json
    symbol_index.json
    chunks.jsonl
    search_index.json
```

### `system-prompts.json` (optional)

Produced only when an OpenAI API key is available. Contains five ready-to-use system
instruction prompts, each tailored to the specific conventions and patterns found in the
scanned repository:

```json
{
  "generatedAt": "2026-02-21T...",
  "model": "gpt-4o-mini",
  "projectId": "...",
  "prompts": {
    "prd_analysis": {
      "purpose": "PRD Analysis",
      "systemPrompt": "You are an expert..."
    },
    "architecture_planning": {
      "purpose": "Architecture Planning",
      "systemPrompt": "You are an expert..."
    },
    "code_generation": {
      "purpose": "Code Generation",
      "systemPrompt": "You are an expert..."
    },
    "component_creation": {
      "purpose": "Component Creation",
      "systemPrompt": "You are an expert..."
    },
    "api_integration": {
      "purpose": "API Integration",
      "systemPrompt": "You are an expert..."
    }
  }
}
```

These prompts encode the project's stack, path aliases, naming style, state management
pattern, and component conventions — ready to be passed as the `system` message in any
downstream GPT-4o / Claude call.

### `qa_report.json`

Always written. Key fields:

```json
{
  "coverage": {
    "tsFilesParsedRatio": 0.97,
    "importsResolvedRatio": 0.81,
    "aliasResolutionConfidence": 0.85
  },
  "readiness": {
    "READY_FOR_PHASE_2": true,
    "missingCriticalContracts": []
  }
}
```

---

## Pipeline stage order

```
intakeRepo                       Clone / validate repo, initialise context
discoverStack                    Read package.json, detect framework + tooling flags
inventoryFilesAndStructure       File tree, extension counts, folder-role inference
extractSymbolsAndDeps            ts-morph AST: exports, imports, dependency graph
extractStyleContract             Normalise tsconfig / eslint / prettier config values
extractModuleResolution          Path aliases, baseUrl, alias-usage scan
extractApiContract               Axios endpoint + base-URL detection
extractStateAndHooksContracts    Redux slices, thunks, hook exports
extractStateStyle                Typed hooks (useAppDispatch/Selector), direct-usage counts
extractTokensAndRules            CSS variables, design tokens, coding rules
inferNamingConventions           File / component / hook naming style inference
analyzeArchitectureBoundaries    Role-to-role edge matrix + cross-layer violation sample
minePatternsAndExamples          5 canonical pattern cards with example snippets
buildChunksAndSearchIndex        MiniSearch index for semantic code retrieval
writeQaReport                    Coverage metrics + READY_FOR_PHASE_2 gate
generateSystemPrompts            ⚡ GPT-4o-mini — produces system-prompts.json (optional)
```

All stages run inside a `try/catch`; failures append to `qa_report.json#warnings` and
do not abort the pipeline.

---

## Scripts

```bash
npm run build      # tsc compile
npm run phase1     # alias for node dist/cli.js phase1
```

---

## Notes

- Parsing is best-effort and resilient to individual file errors.
- AST analysis uses `ts-morph`; all other extraction uses regex / JSON parsing.
- `minisearch` search index is serialized to disk for local retrieval without a vector DB.
- The `openai` package is a runtime dependency but the stage is a no-op without a key.
