# pipe-2 – Phase 2: Clarification Bridge

Takes a **PRD** (markdown or plain text) and the artefacts produced by **pipe-1** (Phase 1 Project DNA) and returns:

- **`impact_analysis.json`** – ranked list of impacted files with scores, roles, evidence, and per-area confidence.
- **`clarifying_questions.json`** – structured questions that need human answers before implementation starts (empty array when PRD is unambiguous).
- **`phase2_run.json`** – run metadata (inputs, timestamp, duration, status).

---

## Prerequisites

- Node.js ≥ 18
- A completed pipe-1 run whose output folder contains an `indexes/` sub-directory.

---

## Install

```bash
cd pipe-2
npm install
npm run build
```

---

## Usage

```bash
node dist/index.js \
  --phase1Out ../out/pipe-1/<runId> \
  --prd      ../path/to/feature.md \
  --out      ../out/pipe-2
```

The pipeline creates `../out/pipe-2/<timestamp>/` and writes three JSON files there.

### All CLI flags

| Flag          | Alias  | Default          | Description                                     |
| ------------- | ------ | ---------------- | ----------------------------------------------- |
| `--phase1Out` | `--p1` | _(required)_     | Phase-1 output directory containing `indexes/`  |
| `--prd`       |        | _(required)_     | Path to PRD `.md` or `.txt` file                |
| `--out`       |        | `../out/pipe-2`  | Root output directory                           |
| `--engine`    |        | `mock`           | AI engine: `mock` (default) or future providers |
| `--runId`     |        | auto (timestamp) | Override the generated run folder name          |

---

## Expected folder layout

```
out/
  pipe-1/
    <runId>/
      indexes/
        search_index.json      ← required
        symbol_index.json      ← required
        depgraph.json          ← required
        files.jsonl            ← optional
        chunks.jsonl           ← optional

  pipe-2/
    <runId>/
      impact_analysis.json
      clarifying_questions.json
      phase2_run.json
```

---

## Sample output

### `impact_analysis.json`

```json
{
  "prd": { "hash": "abc123...", "source": "../docs/feature.md" },
  "generatedAt": "2026-02-20T10:00:00.000Z",
  "summary": {
    "primaryCount": 3,
    "secondaryCount": 5,
    "areas": [
      {
        "area": "API/Service",
        "confidence": 0.45,
        "rationale": ["4 file(s) matched", "e.g. src/services/userApi.ts"]
      },
      {
        "area": "UI",
        "confidence": 0.3,
        "rationale": ["3 file(s) matched", "e.g. src/pages/ProfilePage.tsx"]
      }
    ]
  },
  "files": [
    {
      "path": "src/services/userApi.ts",
      "score": 1.0,
      "role": "primary",
      "reasons": ["Matched PRD terms: user, profile, update"],
      "evidence": {
        "matchedTerms": ["user", "profile", "update"],
        "depDistance": 0
      }
    }
  ],
  "graphExpansion": { "enabled": true, "direction": "both", "maxDepth": 2 },
  "notes": ["Analyzed using MockAIEngine (heuristics-only, no external API)."]
}
```

### `clarifying_questions.json`

```json
[
  {
    "id": "q-scope-1",
    "questionText": "Which user roles or personas are primarily affected by this change?",
    "type": "multi_select",
    "required": true,
    "options": ["Admin", "End User", "Guest", "API Consumer", "All roles"],
    "rationale": "Scope of impacted users affects which auth/permission files need changes."
  }
]
```

---

## Architecture

```
src/
  index.ts                   CLI entry (yargs)
  contracts/
    phase2.ts                All shared TypeScript types / interfaces
  phase2/
    runPhase2.ts             Pipeline orchestrator
    loadPhase1.ts            Loads indexes from phase-1 output folder
    prdReader.ts             Reads + normalises PRD text
    ai/
      AIEngine.ts            Re-exports AIEngine interface
      MockAIEngine.ts        Deterministic heuristics engine (no API calls)
    utils/
      text.ts                tokenize(), extractKeywords(), detectAmbiguitySignals()
      scoring.ts             computeRawScore(), normaliseScores(), mergeScored()
      classify.ts            classifyFile(), computeAreaConfidences()
```

### AI Engine interface

```typescript
interface AIEngine {
  analyze(input: AnalyzeInput): Promise<AnalyzeOutput>;
}
```

Implement this interface and pass your engine via `runPhase2({ …, engine: myEngine })` or register it in `src/index.ts`'s `resolveEngine()` function.

---

## MockAIEngine algorithm

1. **Tokenise PRD** – extract lower-case keywords + PascalCase/camelCase code tokens.
2. **Seed files** – scan `search_index` docs and `symbol_index` entries for token overlap.
3. **Graph expansion** – BFS up to depth 2 in both directions of `depgraph`, applying `0.5^depth` score decay.
4. **Normalise & threshold** – scores divided by max, files below 0.05 discarded.
5. **Classify areas** – heuristic path matching → ImpactArea buckets.
6. **Questions** – generated when ambiguity signals (`TBD`, `?`, `maybe`, …) detected OR confidence is low.

---

## Adding a real AI engine

```typescript
// src/phase2/ai/OpenAIEngine.ts
import { AIEngine, AnalyzeInput, AnalyzeOutput } from "../../contracts/phase2";

export class OpenAIEngine implements AIEngine {
  async analyze(input: AnalyzeInput): Promise<AnalyzeOutput> {
    // call OpenAI API using input.prdText and input.indexes
  }
}
```

Then register it in `src/index.ts`:

```typescript
case "openai":
  return new OpenAIEngine();
```

---

## Development

```bash
# Type-check without emitting
npx tsc --noEmit

# Build
npm run build

# Run
node dist/index.js --phase1Out ../out/pipe-1/my-run --prd ../docs/prd.md
```
