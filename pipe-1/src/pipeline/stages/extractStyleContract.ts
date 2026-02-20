/**
 * extractStyleContract
 *
 * Parses project tooling configs (tsconfig, eslint, prettier) and produces a
 * normalized `style-contract.json` artifact.  All parsing is static JSON/text
 * — no AST, no runtime type-checking.
 */
import path from "node:path";
import fg from "fast-glob";
import { StyleContract, PipelineContext } from "../../types/pipeline";
import { readJsonIfPossible, readTextSafe, writeJson } from "../../utils/fs";

// Rules that materially affect code generation decisions.
const IMPORTANT_ESLINT_RULES = [
  "no-console",
  "no-unused-vars",
  "react-hooks/rules-of-hooks",
  "react-hooks/exhaustive-deps",
  "import/no-cycle",
  "@typescript-eslint/no-explicit-any",
  "@typescript-eslint/no-unused-vars",
  "@typescript-eslint/consistent-type-imports",
  "import/order",
];

// ─── Tsconfig helpers ────────────────────────────────────────────────────────

interface TsCompilerOptions {
  strict?: boolean;
  jsx?: string;
  baseUrl?: string;
  paths?: Record<string, string[]>;
  moduleResolution?: string;
  target?: string;
}

interface TsConfigShape {
  compilerOptions?: TsCompilerOptions;
}

async function parseTsconfig(
  repoPath: string,
): Promise<StyleContract["typescript"]> {
  const tsconfigPath = path.join(repoPath, "tsconfig.json");
  const raw = await readJsonIfPossible<TsConfigShape>(tsconfigPath);
  const co = raw?.compilerOptions ?? {};

  return {
    strict: Boolean(co.strict),
    jsx: co.jsx ?? null,
    ...(co.baseUrl !== undefined ? { baseUrl: co.baseUrl } : {}),
    ...(co.paths && Object.keys(co.paths).length > 0
      ? { pathAliases: co.paths }
      : {}),
    ...(co.moduleResolution !== undefined
      ? { moduleResolution: co.moduleResolution }
      : {}),
    ...(co.target !== undefined ? { target: co.target } : {}),
  };
}

// ─── ESLint helpers ───────────────────────────────────────────────────────────

async function findFirstFile(
  cwd: string,
  patterns: string[],
): Promise<string | undefined> {
  const hits = await fg(patterns, {
    cwd,
    onlyFiles: true,
    dot: true,
    absolute: true,
  });
  return hits[0];
}

interface EslintConfigShape {
  rules?: Record<string, unknown>;
  overrides?: Array<{ rules?: Record<string, unknown> }>;
}

async function parseEslint(repoPath: string): Promise<StyleContract["eslint"]> {
  const eslintPath = await findFirstFile(repoPath, [
    ".eslintrc",
    ".eslintrc.json",
    ".eslintrc.js",
    ".eslintrc.cjs",
    ".eslintrc.yaml",
    ".eslintrc.yml",
  ]);

  if (!eslintPath) {
    return { present: false, importantRules: {} };
  }

  // Attempt JSON parse; JS config files will fail gracefully.
  const raw = await readJsonIfPossible<EslintConfigShape>(eslintPath);

  // Merge top-level rules + first override rules
  const merged: Record<string, unknown> = {
    ...(raw?.overrides?.[0]?.rules ?? {}),
    ...(raw?.rules ?? {}),
  };

  const importantRules: Record<string, unknown> = {};
  for (const ruleName of IMPORTANT_ESLINT_RULES) {
    if (ruleName in merged) {
      importantRules[ruleName] = merged[ruleName];
    }
  }

  // Fallback: scan raw text for rule names that might appear in JS exports
  if (Object.keys(importantRules).length === 0) {
    const rawText = await readTextSafe(eslintPath, 20_000);
    if (rawText) {
      for (const ruleName of IMPORTANT_ESLINT_RULES) {
        if (
          rawText.includes(`"${ruleName}"`) ||
          rawText.includes(`'${ruleName}'`)
        ) {
          importantRules[ruleName] = "present";
        }
      }
    }
  }

  return { present: true, importantRules };
}

// ─── Prettier helpers ─────────────────────────────────────────────────────────

interface PrettierConfigShape {
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: string;
  printWidth?: number;
}

async function parsePrettier(
  repoPath: string,
): Promise<StyleContract["prettier"]> {
  const defaults: StyleContract["prettier"] = {
    present: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    printWidth: 80,
  };

  const prettierPath = await findFirstFile(repoPath, [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    ".prettierrc.cjs",
    ".prettierrc.yaml",
    ".prettierrc.yml",
    "prettier.config.js",
    "prettier.config.cjs",
  ]);

  if (!prettierPath) {
    return defaults;
  }

  const raw = await readJsonIfPossible<PrettierConfigShape>(prettierPath);
  if (!raw) {
    // File present but not parseable JSON (JS config)
    return { ...defaults, present: true };
  }

  return {
    present: true,
    semi: raw.semi !== undefined ? Boolean(raw.semi) : defaults.semi,
    singleQuote:
      raw.singleQuote !== undefined
        ? Boolean(raw.singleQuote)
        : defaults.singleQuote,
    trailingComma: raw.trailingComma ?? defaults.trailingComma,
    printWidth:
      typeof raw.printWidth === "number" ? raw.printWidth : defaults.printWidth,
  };
}

// ─── Stage entry point ────────────────────────────────────────────────────────

export async function extractStyleContract(
  ctx: PipelineContext,
): Promise<void> {
  const [typescript, eslint, prettier] = await Promise.all([
    parseTsconfig(ctx.workingRepoPath),
    parseEslint(ctx.workingRepoPath),
    parsePrettier(ctx.workingRepoPath),
  ]);

  const contract: StyleContract = { typescript, eslint, prettier };

  await writeJson(path.join(ctx.dnaDir, "style-contract.json"), contract);
}
