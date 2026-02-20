/**
 * generateSystemPrompts
 *
 * Sends the complete project DNA + all canonical code examples to GPT-4o
 * and asks the model to produce a comprehensive GitHub Copilot instructions
 * markdown document — an authoritative, richly detailed guide that encodes
 * architecture, stack, naming conventions, patterns, API layer, state
 * management, component patterns, utilities, and domain features WITH real
 * code snippets extracted from the actual codebase.
 *
 * Output:
 *   project-dna/copilot-instructions.md   ← comprehensive markdown document
 *   project-dna/system-prompts.json       ← thin wrapper (backward compat)
 *
 * Stage is skipped gracefully if no OpenAI API key is available.
 */
import path from "node:path";
import fs from "node:fs/promises";
import readline from "node:readline";
import { createReadStream } from "node:fs";
import OpenAI from "openai";
import { PipelineContext, SystemPromptsOutput } from "../../types/pipeline";
import { readJsonIfPossible, writeJson } from "../../utils/fs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely read and pretty-stringify a DNA artifact (≤120 kB safety cap). */
async function readArtifact(filePath: string): Promise<string> {
  const data = await readJsonIfPossible<unknown>(filePath);
  if (data == null) return "{}";
  const pretty = JSON.stringify(data, null, 2);
  // Hard-cap at ~40 KB per artifact to keep the total context manageable
  return pretty.length > 40_000
    ? pretty.slice(0, 40_000) + "\n…(truncated)"
    : pretty;
}

/** Read all *.md files from the examples sub-directory and concatenate them. */
async function readExamples(examplesDir: string): Promise<string> {
  let result = "";
  try {
    const entries = await fs.readdir(examplesDir);
    const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();
    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(examplesDir, file), "utf8");
      result += `\n### ${file}\n${content}\n`;
    }
  } catch {
    // examples dir may not exist — that's fine
  }
  return result.trim();
}

/** Read the first N lines from a JSONL file.  Returns parsed objects. */
async function readJsonlHead(
  filePath: string,
  limit: number,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  try {
    const rl = readline.createInterface({
      input: createReadStream(filePath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        rows.push(JSON.parse(line));
      } catch {
        /* skip bad lines */
      }
      if (rows.length >= limit) {
        rl.close();
        break;
      }
    }
  } catch {
    /* file may not exist */
  }
  return rows;
}

// ─── System prompt for the meta-call ─────────────────────────────────────────

const META_SYSTEM_PROMPT = `You are a senior software architect and technical writer who specialises in
producing developer-facing documentation for AI coding assistants.

You will be given a "Project DNA Snapshot" that contains:
  • Structured JSON artifacts describing a codebase
    (manifest, stack, folder structure, API contract, state management,
     hooks, naming conventions, style rules, pattern cards, architecture
     boundaries, QA report, etc.)
  • Real code examples extracted verbatim from the codebase

Your ONLY task is to produce a SINGLE, LONG, RICHLY DETAILED GitHub Copilot
instructions file in Markdown that any AI coding assistant can use as its
authoritative guide for this exact project.  The output MUST be at least
800 lines long and be exhaustively comprehensive.

────────────────────────────────────────────────────────────────────────────
REQUIRED DOCUMENT STRUCTURE  (every section is mandatory)
────────────────────────────────────────────────────────────────────────────

# GitHub Copilot Instructions for <Project Name>

---

## applyTo: '\*\*'

Write a preamble paragraph explaining what this file is and how AI coding
assistants should use it as the authoritative guide for the project.

## Project Overview
Full description: what the project is, its purpose, primary users, scale,
and business domain.  Derive this from the manifest, folder structure, and
any domain clues in the DNA.

## Architecture & Technology Stack
### Core Technologies
List EVERY major library/framework detected with exact versions (from
manifest / package.json dependencies and devDependencies).  Format as a
bulleted list with bold names and versions.
### Project Structure
Full annotated directory tree (use a fenced code block) showing the role
of each top-level and second-level folder.

## Code Style & Standards
### Formatting & Linting
ALL Prettier options (exact values), ESLint config details, file-naming
rules (kebab-case, PascalCase, etc.), commitlint convention.  Show the
complete Prettier config as a fenced \`\`\`json code block.
### Import Organization
Preferred import order with a fully annotated code example showing the
order: framework → UI library → third-party → local hooks → redux/state →
services → constants → types.

## State Management
Describe every state management approach detected (Redux Toolkit, SWR,
Context, Zustand, MobX, etc).  For each one include:
  - Configuration / setup snippet
  - Full pattern example (e.g. createSlice + createAsyncThunk with
    extraReducers)
  - Typed hooks pattern (useAppDispatch / useAppSelector) if applicable
  - Usage example with real code from the codebase

## Component Patterns
Each pattern MUST include a full code example from the codebase:
  - Page structure with any authorization / guard components
  - Permission-based conditional rendering
  - Primary form handling pattern (whichever form library is dominant)
  - Secondary form pattern (if a second form library is detected)
  - Table / data-grid pattern with any custom hooks
  - Styling approach (CSS-in-JS, CSS modules, Tailwind, etc.) with usage example
  - Any other recurring component patterns found in pattern cards

## API Integration
### HTTP Client Configuration
List EVERY named HTTP client instance found (axios, fetch wrappers, etc.),
its variable name, base URL, and interceptor details.
### Service Layer Pattern
Canonical service module shape with a complete code example.
### Error Handling
Exact pattern for try/catch with user feedback (toast / message /
notification library used in the project).

## Navigation & Routing
Routing approach (Next.js pages router, app router, react-router, etc.).
Menu / navigation configuration shape with any role-based access.
Provide config code examples.
Page-level permissions configuration if applicable.

## Authentication & Authorization
Step-by-step auth flow as detected from the codebase.
Hook-based and component-based authorization patterns with code examples.
Include any role/permission constants or configuration.

## Common Utilities
Every discovered utility module (date formatting, file export, form
helpers, analytics, validation, etc.) with:
  - Import statement
  - Brief description
  - Usage snippet

## Testing & Quality
Testing framework and setup (Jest, Vitest, Cypress, Playwright, etc.).
Test-id conventions and ESLint rules if any.
Exact lint / test / type-check commands (yarn/npm/pnpm).

## Environment Variables
Full list of required env vars (from manifest / .env files) as a fenced
\`\`\`bash code block with example placeholder values.

## Development Workflow
### Local Development
Exact commands to install, dev, build, start.  Any special setup
requirements (SSL certs, reverse proxy, hosts file, Docker, etc.).
### Local Setup Requirements
List any prerequisites (Node version, package manager, external services).
### Git Workflow
Conventional commits format, branch naming convention, PR review
requirements, CI/CD pipeline details if evident.

## Performance Considerations
Code splitting strategy, lazy loading, tree-shaking setup, bundle
analysis tools.  Each with a code example where applicable.

## Common Patterns to Follow
Numbered list (at least 12 items) of the most important conventions
and patterns a developer must follow.  Derive from pattern cards, naming
conventions, and architecture boundaries.

## Domain-Specific Features
For EACH major product domain / feature area found in the codebase:
  - The purpose of that domain
  - Key components / pages / modules involved
  - Any special patterns or business logic

## Debugging & Development Tools
DevTools integration (Redux DevTools, React DevTools, etc.).
Logging patterns, source maps, any debug utilities.

## Migration Notes
Any ongoing migrations detected (JS→TS, class→functional, library
upgrades) with guidance on how new code should be written.

## Best Practices
Numbered list (at least 10 items) of project-specific best practices
grounded in the DNA data.

────────────────────────────────────────────────────────────────────────────
STRICT RULES
────────────────────────────────────────────────────────────────────────────
1. Ground EVERY statement in the actual DNA data — do NOT invent version
   numbers, library names, or features that are not evidenced in the data.
2. Every section that mentions a pattern MUST include a real fenced code
   block (use the real snippets from the provided examples whenever
   available;  if no real snippet exists, derive a representative example
   based on the patterns/contracts detected, and mark it with a comment
   like "// Pattern derived from project DNA").
3. Use correct language tags on all fenced code blocks (typescript,
   javascript, bash, json, css, etc.).
4. Output RAW Markdown only — no JSON wrapper, no XML tags, no preamble
   text before the first # heading.
5. The document must be comprehensive enough that a developer who has
   NEVER seen this codebase can immediately write code fully consistent
   with its conventions.
6. Be exhaustive: include every axios instance, every hook, every Redux
   slice, every utility, every pattern card.  Do not summarize or skip.
7. If a section has no relevant data (e.g. no SWR detected), write the
   section header and note "Not detected in this project" — do NOT omit
   the section.
8. End the document with exactly:
   "Remember: <one-sentence mission statement derived from the project
   overview>."
9. The document MUST be at least 800 lines.  Be verbose, include long
   code examples, and explain each pattern thoroughly.`;

// ─── Stage entry point ────────────────────────────────────────────────────────

export async function generateSystemPrompts(
  ctx: PipelineContext,
): Promise<void> {
  const dna = ctx.dnaDir;
  const indexesDir = ctx.indexesDir;
  const examplesDir = ctx.examplesDir;

  console.log("  DNA dir    :", dna);
  console.log("  Indexes dir:", indexesDir);
  console.log("  Examples dir:", examplesDir);
  console.log(
    "  OpenAI key  :",
    ctx.openaiApiKey ? "[set]" : "[NOT SET — will skip]",
  );

  if (!ctx.openaiApiKey) {
    console.warn(
      "  SKIP: no OpenAI API key. Pass --openai-key or set OPENAI_API_KEY env var.",
    );
    ctx.warnings.push(
      "generateSystemPrompts: skipped — no OpenAI API key provided (set OPENAI_API_KEY or pass --openai-key).",
    );
    return;
  }

  // ── 1. Read every DNA artifact in parallel ────────────────────────────────
  const [
    manifest,
    structure,
    apiContract,
    stateContract,
    hooksContract,
    tokens,
    rules,
    patternCards,
    styleContract,
    moduleResolution,
    namingConventions,
    archBoundaries,
    stateStyle,
    qaReport,
    conventions,
  ] = await Promise.all([
    readArtifact(path.join(dna, "manifest.json")),
    readArtifact(path.join(dna, "structure.json")),
    readArtifact(path.join(dna, "api-contract.json")),
    readArtifact(path.join(dna, "state-contract.json")),
    readArtifact(path.join(dna, "hooks-contract.json")),
    readArtifact(path.join(dna, "tokens.json")),
    readArtifact(path.join(dna, "rules.json")),
    readArtifact(path.join(dna, "pattern-cards.json")),
    readArtifact(path.join(dna, "style-contract.json")),
    readArtifact(path.join(dna, "module-resolution.json")),
    readArtifact(path.join(dna, "naming-conventions.json")),
    readArtifact(path.join(dna, "architecture-boundaries.json")),
    readArtifact(path.join(dna, "state-style.json")),
    readArtifact(path.join(dna, "qa_report.json")),
    readArtifact(path.join(dna, "conventions.json")),
  ]);

  // ── 2. Read real code example markdown files ──────────────────────────────
  const examplesBlock = await readExamples(examplesDir);

  // ── 3. Read a representative sample of code chunks from the index ─────────
  const chunkSample = await readJsonlHead(
    path.join(indexesDir, "chunks.jsonl"),
    40, // first 40 chunks — enough to give the LLM real code context
  );
  const chunksText = chunkSample
    .map((c: any) => `[${c.file ?? ""}]\n${c.text ?? ""}`)
    .join("\n\n---\n\n");

  // ── 4. Read export/symbol index summary ──────────────────────────────────
  const symbolIndexRaw = await readJsonIfPossible<Record<string, unknown>>(
    path.join(indexesDir, "symbol_index.json"),
  );
  const topSymbols = symbolIndexRaw
    ? Object.entries(symbolIndexRaw)
        .slice(0, 80)
        .map(([sym, meta]) => `${sym}: ${JSON.stringify(meta)}`)
        .join("\n")
    : "";

  // ── 5. Compose the user message ───────────────────────────────────────────
  const userMessage = `
════════════════════════════════════════════════════════════════════════════
 PROJECT DNA SNAPSHOT
════════════════════════════════════════════════════════════════════════════

─── MANIFEST (stack, configs, fingerprint) ───────────────────────────────
${manifest}

─── FOLDER STRUCTURE & ROLES ──────────────────────────────────────────────
${structure}

─── STYLE CONTRACT (tsconfig / eslint / prettier) ─────────────────────────
${styleContract}

─── CONVENTIONS (commitlint / prettier / eslint presence) ─────────────────
${conventions}

─── MODULE RESOLUTION (path aliases) ──────────────────────────────────────
${moduleResolution}

─── NAMING CONVENTIONS ────────────────────────────────────────────────────
${namingConventions}

─── API CONTRACT (axios instances / service modules / endpoints) ───────────
${apiContract}

─── STATE CONTRACT (redux slices / store / async thunks) ──────────────────
${stateContract}

─── STATE STYLE (typed hooks / useSelector usage counts) ──────────────────
${stateStyle}

─── HOOKS CONTRACT ────────────────────────────────────────────────────────
${hooksContract}

─── DESIGN TOKENS ─────────────────────────────────────────────────────────
${tokens}

─── LINTING / ARCHITECTURE RULES ──────────────────────────────────────────
${rules}

─── PATTERN CARDS ─────────────────────────────────────────────────────────
${patternCards}

─── ARCHITECTURE BOUNDARIES ───────────────────────────────────────────────
${archBoundaries}

─── QA REPORT ─────────────────────────────────────────────────────────────
${qaReport}

────────────────────────────────────────────────────────────────────────────
 REAL CODE EXAMPLES (extracted verbatim from the codebase)
────────────────────────────────────────────────────────────────────────────
${examplesBlock || "(no example files found)"}

────────────────────────────────────────────────────────────────────────────
 CODE CHUNK SAMPLE (first 40 chunks from search index)
────────────────────────────────────────────────────────────────────────────
${chunksText || "(no chunks found)"}

────────────────────────────────────────────────────────────────────────────
 SYMBOL INDEX SAMPLE (first 80 exports)
────────────────────────────────────────────────────────────────────────────
${topSymbols || "(no symbol index found)"}

════════════════════════════════════════════════════════════════════════════
Now produce the comprehensive GitHub Copilot instructions document.
It MUST be at least 800 lines, cover EVERY required section listed in the
system prompt, and include real code examples grounded in the data above.
Be exhaustive — list every library version, every axios instance, every
Redux slice, every hook, every utility.  Do NOT summarize or abbreviate.
════════════════════════════════════════════════════════════════════════════
`.trim();

  // ── 6. Call GPT-4o ────────────────────────────────────────────────────────
  const client = new OpenAI({ apiKey: ctx.openaiApiKey });

  console.log("  Calling GPT-4o (max_tokens: 16000)…");
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.15,
    max_tokens: 16000,
    messages: [
      { role: "system", content: META_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const markdownContent = response.choices[0]?.message?.content?.trim() ?? "";

  if (!markdownContent) {
    ctx.warnings.push(
      "generateSystemPrompts: LLM returned empty content — skipping output.",
    );
    return;
  }

  // ── 7. Write copilot-instructions.md ─────────────────────────────────────
  const lineCount = markdownContent.split("\n").length;
  console.log(`  LLM call successful — generated ${lineCount} lines.`);
  console.log("  Writing copilot-instructions.md…");
  const mdPath = path.join(dna, "copilot-instructions.md");
  await fs.writeFile(mdPath, markdownContent, "utf8");
  console.log(`  ✓ copilot-instructions.md written (${lineCount} lines).`);

  // ── 8. Write thin system-prompts.json wrapper (backward compat) ───────────
  const output: SystemPromptsOutput = {
    generatedAt: new Date().toISOString(),
    model: response.model ?? "gpt-4o",
    projectId: ctx.projectId,
    prompts: {
      prd_analysis: {
        purpose: "PRD Analysis",
        systemPrompt: markdownContent,
      },
      architecture_planning: {
        purpose: "Architecture Planning",
        systemPrompt: markdownContent,
      },
      code_generation: {
        purpose: "Code Generation",
        systemPrompt: markdownContent,
      },
      component_creation: {
        purpose: "Component Creation",
        systemPrompt: markdownContent,
      },
      api_integration: {
        purpose: "API Integration",
        systemPrompt: markdownContent,
      },
    },
  };

  await writeJson(path.join(dna, "system-prompts.json"), output);
}
