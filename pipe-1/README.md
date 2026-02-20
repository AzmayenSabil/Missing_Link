# missing-link (pipe-1 / Phase 1 MVP)

`missing-link` generates a JSON-only **Project DNA** bundle from a local repository path or a git URL.

## Constraints

- Local-only execution
- No Docker
- No SQL / external database
- Filesystem outputs only (`JSON` / `JSONL`)
- Never executes untrusted repository code

## Install

```bash
cd pipe-1
npm install
npm run build
```

## Run

Local repo path:

```bash
cd pipe-1
missing-link phase1 --repo <path>
```

Or with npm script:

```bash
cd pipe-1
npm run phase1 -- --repo <path>
```

Git URL intake:

```bash
cd pipe-1
npm run phase1 -- --git <url>
```

Example with your repo:

```bash
cd pipe-1
npm run phase1 -- --git https://github.com/AzmayenSabil/redx-admin-hub.git
```

Options:

- `--out <dir>` output root directory (default: `../out/pipe-1`)
- `--projectId <id>` explicit project id

If both `--repo` and `--git` are provided, `--repo` is preferred.

## Output

The pipeline writes:

- `../out/pipe-1/<project_id>/project-dna/*`
- `../out/pipe-1/<project_id>/indexes/*`

If you pass `--out`, paths become `<out>/<project_id>/...`.

### `project-dna/`

- `manifest.json`
- `structure.json`
- `conventions.json`
- `tokens.json`
- `rules.json`
- `api-contract.json`
- `state-contract.json`
- `hooks-contract.json`
- `pattern-cards.json`
- `examples/`
  - `authorize-page.md`
  - `service-layer.md`
  - `redux-slice.md`
  - `hook-usage.md`
  - `styling.md`
- `qa_report.json`

### `indexes/`

- `files.jsonl`
- `exports.jsonl`
- `imports.jsonl`
- `depgraph.json`
- `symbol_index.json`
- `chunks.jsonl`
- `search_index.json`

## Scripts

- `npm run build` compiles TypeScript
- `npm run phase1 -- --repo <path>` runs Phase 1 extractor

## Notes

- Parsing is best-effort and resilient to parse errors.
- Source analysis uses AST (`ts-morph`) where possible, with fallback heuristics.
- Search index uses `minisearch` and is serialized to disk for local retrieval.
