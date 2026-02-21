/**
 * OpenAIEngine.ts – Real OpenAI gpt-4o implementation for PRD analysis.
 *
 * Makes two distinct API calls per session:
 *   1. Question generation (after PRD upload)
 *   2. Impact analysis (after all questions answered)
 */

import OpenAI from "openai";
import type {
  Question,
  Answer,
  ImpactAnalysis,
  ImpactFile,
  ImpactArea,
  PrdMeta,
  Phase1Indexes,
} from "../contracts/phase2";
import type { ProjectDNA } from "../services/phase1Loader.service";
import { buildCodebaseContext } from "./prompts/contextBuilder";
import { buildQuestionGenerationPrompt } from "./prompts/questionGeneration.prompt";
import { buildImpactAnalysisPrompt } from "./prompts/impactAnalysis.prompt";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const VALID_AREAS: ImpactArea[] = [
  "UI",
  "Hooks",
  "State",
  "API/Service",
  "Auth",
  "Routing",
  "Styling",
  "Types",
  "Tests",
  "Build/Config",
  "Unknown",
];

const VALID_ROLES = [
  "primary",
  "secondary",
  "dependency",
  "dependent",
] as const;

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3,
  delayMs = 3000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err as Error).message ?? "";
      const isTransient =
        msg.includes("Connection error") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("network") ||
        (err as { status?: number }).status === 429 ||
        (err as { status?: number }).status === 503;

      if (isTransient && attempt < maxAttempts) {
        const wait = delayMs * attempt;
        console.warn(
          `  [OpenAI] ${label} attempt ${attempt}/${maxAttempts} failed (${msg}). Retrying in ${wait}ms…`,
        );
        await new Promise((r) => setTimeout(r, wait));
      } else {
        break;
      }
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// OpenAI Engine
// ---------------------------------------------------------------------------

export class OpenAIEngine {
  readonly name = "OpenAIEngine";
  private client: OpenAI;
  private model = "gpt-4o";

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate clarifying questions from PRD + codebase context.
   */
  async generateQuestions(
    prdText: string,
    dna: ProjectDNA,
    indexes: Phase1Indexes,
  ): Promise<Question[]> {
    const context = buildCodebaseContext(dna, indexes);
    const { system, user } = buildQuestionGenerationPrompt(prdText, context);

    console.log("  [OpenAI] Generating clarifying questions...");

    const response = await withRetry(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_completion_tokens: 4096,
        }),
      "generateQuestions",
    );

    const content = response.choices[0]?.message?.content;
    if (!content)
      throw new Error("OpenAI returned empty response for question generation");

    const parsed = JSON.parse(content);
    const questions = parsed.questions ?? parsed;

    if (!Array.isArray(questions)) {
      throw new Error("OpenAI response does not contain a questions array");
    }

    // Validate and clean questions
    const validated: Question[] = questions
      .filter((q: unknown) => {
        if (!q || typeof q !== "object") return false;
        const obj = q as Record<string, unknown>;
        return obj.id && obj.questionText && obj.type;
      })
      .map((q: Record<string, unknown>, idx: number) => ({
        id: (q.id as string) || `q-auto-${idx + 1}`,
        questionText: q.questionText as string,
        type: (["text", "single_select", "multi_select"].includes(
          q.type as string,
        )
          ? q.type
          : "text") as Question["type"],
        required: q.required !== false,
        ...(Array.isArray(q.options) ? { options: q.options as string[] } : {}),
        ...(q.rationale ? { rationale: q.rationale as string } : {}),
      }));

    console.log(`  [OpenAI] Generated ${validated.length} questions`);
    return validated;
  }

  /**
   * Generate impact analysis from PRD + context + answered questions.
   */
  async generateImpactAnalysis(
    prdText: string,
    prdMeta: PrdMeta,
    dna: ProjectDNA,
    indexes: Phase1Indexes,
    questionsAndAnswers: Array<{ question: Question; answer: Answer }>,
  ): Promise<ImpactAnalysis> {
    const context = buildCodebaseContext(dna, indexes);
    const { system, user } = buildImpactAnalysisPrompt(
      prdText,
      context,
      questionsAndAnswers,
      indexes.allFiles,
    );

    console.log("  [OpenAI] Generating impact analysis...");

    const response = await withRetry(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_completion_tokens: 8192,
        }),
      "generateImpactAnalysis",
    );

    const content = response.choices[0]?.message?.content;
    if (!content)
      throw new Error("OpenAI returned empty response for impact analysis");

    const parsed = JSON.parse(content);

    // Assemble into ImpactAnalysis shape
    const impact = this.assembleImpactAnalysis(parsed, prdMeta);
    console.log(
      `  [OpenAI] Impact analysis complete: ${impact.files.length} files, ${impact.summary.areas.length} areas`,
    );
    return impact;
  }

  /**
   * Transform raw OpenAI JSON response into pipe-3 compatible ImpactAnalysis.
   */
  private assembleImpactAnalysis(
    raw: Record<string, unknown>,
    prdMeta: PrdMeta,
  ): ImpactAnalysis {
    const rawFiles = (raw.files as Array<Record<string, unknown>>) ?? [];
    const rawAreas = (raw.areas as Array<Record<string, unknown>>) ?? [];
    const rawNotes = (raw.notes as string[]) ?? [];
    const newFileSuggestions =
      (raw.newFileSuggestions as Array<Record<string, unknown>>) ?? [];

    // Validate and clean files
    const files: ImpactFile[] = rawFiles
      .filter((f) => f.path && typeof f.score === "number")
      .map((f) => ({
        path: f.path as string,
        score:
          Math.round(Math.min(1, Math.max(0, f.score as number)) * 1000) / 1000,
        role: VALID_ROLES.includes(f.role as (typeof VALID_ROLES)[number])
          ? (f.role as ImpactFile["role"])
          : "secondary",
        reasons: Array.isArray(f.reasons) ? (f.reasons as string[]) : [],
        evidence: {
          ...(Array.isArray(
            (f.evidence as Record<string, unknown>)?.matchedTerms,
          )
            ? {
                matchedTerms: (f.evidence as Record<string, unknown>)
                  .matchedTerms as string[],
              }
            : {}),
          ...(Array.isArray(
            (f.evidence as Record<string, unknown>)?.matchedSymbols,
          )
            ? {
                matchedSymbols: (f.evidence as Record<string, unknown>)
                  .matchedSymbols as string[],
              }
            : {}),
          depDistance:
            ((f.evidence as Record<string, unknown>)?.depDistance as number) ??
            0,
        },
      }));

    // Validate and clean areas
    const areas = rawAreas
      .filter((a) => a.area && typeof a.confidence === "number")
      .map((a) => ({
        area: (VALID_AREAS.includes(a.area as ImpactArea)
          ? a.area
          : "Unknown") as ImpactArea,
        confidence:
          Math.round(Math.min(1, Math.max(0, a.confidence as number)) * 1000) /
          1000,
        rationale: Array.isArray(a.rationale) ? (a.rationale as string[]) : [],
      }));

    const primaryCount = files.filter((f) => f.role === "primary").length;
    const secondaryCount = files.filter((f) => f.role === "secondary").length;

    // Add new file suggestions to notes
    const notes = [
      "Analyzed using OpenAIEngine (gpt-4o).",
      ...rawNotes,
      ...newFileSuggestions.map(
        (s) => `Suggested new file: ${s.path} – ${s.reason}`,
      ),
    ];

    return {
      prd: prdMeta,
      generatedAt: new Date().toISOString(),
      summary: {
        primaryCount,
        secondaryCount,
        areas,
      },
      files,
      graphExpansion: {
        enabled: false,
        direction: "both",
        maxDepth: 0,
      },
      notes,
    };
  }
}
