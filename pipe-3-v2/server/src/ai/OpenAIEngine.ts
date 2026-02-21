/**
 * OpenAIEngine.ts – Real OpenAI integration for subtask generation
 * and agent prompt pack creation.
 */

import OpenAI from "openai";
import type {
  PlanStep,
  AgentPrompt,
  AgentPromptPack,
  Roadmap,
  Phase1Summary,
  Phase2Summary,
  ImpactAnalysis,
  ImpactArea,
  StepKind,
} from "../contracts/phase3";
import {
  buildCodebaseContext,
  buildImpactContext,
} from "./prompts/contextBuilder";
import { buildSubtaskGenerationPrompt } from "./prompts/subtaskGeneration.prompt";
import { buildPromptGenerationPrompt } from "./prompts/promptGeneration.prompt";

const MODEL = "gpt-5.2";

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
const VALID_KINDS: StepKind[] = [
  "create",
  "modify",
  "refactor",
  "config",
  "test",
  "docs",
];

export class OpenAIEngine {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  // ─── Subtask Generation ──────────────────────────────────────────────

  async generateSubtasks(
    phase1: Phase1Summary,
    phase2: Phase2Summary,
    impact: ImpactAnalysis,
    prdText: string | null,
  ): Promise<PlanStep[]> {
    const codebaseContext = buildCodebaseContext(phase1);
    const impactContext = buildImpactContext(phase2, impact);
    const prompt = buildSubtaskGenerationPrompt(
      prdText ?? "",
      codebaseContext,
      impactContext,
      phase1.allFiles,
    );

    console.log("  [ai] Calling OpenAI for subtask generation...");

    const response = await withRetry(
      () =>
        this.client.chat.completions.create({
          model: MODEL,
          temperature: 0.3,
          max_completion_tokens: 16384,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
        }),
      "generateSubtasks",
    );

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { subtasks?: unknown[] };

    if (!Array.isArray(parsed.subtasks)) {
      throw new Error("OpenAI response missing 'subtasks' array");
    }

    return this.validateSubtasks(parsed.subtasks);
  }

  private validateSubtasks(raw: unknown[]): PlanStep[] {
    const validated: PlanStep[] = [];
    let counter = 0;

    for (const item of raw) {
      const s = item as Record<string, unknown>;
      if (!s.title || !s.description) continue;

      counter++;
      const area = VALID_AREAS.includes(s.area as ImpactArea)
        ? (s.area as ImpactArea)
        : "Unknown";
      const kind = VALID_KINDS.includes(s.kind as StepKind)
        ? (s.kind as StepKind)
        : "modify";

      const files = s.files as Record<string, string[]> | undefined;

      validated.push({
        id:
          (s.id as string) ||
          `step-${area.toLowerCase().replace(/\//g, "-")}-${counter}`,
        title: s.title as string,
        description: s.description as string,
        area,
        kind,
        files: {
          modify: Array.isArray(files?.modify) ? files.modify : [],
          create: Array.isArray(files?.create) ? files.create : [],
          touch: Array.isArray(files?.touch) ? files.touch : [],
        },
        dependsOnStepIds: Array.isArray(s.dependsOnStepIds)
          ? (s.dependsOnStepIds as string[])
          : [],
        rationale: Array.isArray(s.rationale) ? (s.rationale as string[]) : [],
        implementationChecklist: Array.isArray(s.implementationChecklist)
          ? (s.implementationChecklist as string[])
          : [],
        doneWhen: Array.isArray(s.doneWhen) ? (s.doneWhen as string[]) : [],
        durationHours:
          typeof s.durationHours === "number"
            ? Math.max(0.5, Math.min(40, s.durationHours))
            : 1,
      });
    }

    console.log(`  [ai] Validated ${validated.length} subtasks`);
    return validated;
  }

  // ─── Prompt Pack Generation ──────────────────────────────────────────

  async generatePrompts(
    subtasks: PlanStep[],
    phase1: Phase1Summary,
    prdText: string | null,
  ): Promise<AgentPromptPack> {
    const codebaseContext = buildCodebaseContext(phase1);
    const prompt = buildPromptGenerationPrompt(
      subtasks,
      prdText ?? "",
      codebaseContext,
      phase1.conventions,
      phase1.rules,
      phase1.tokens,
    );

    console.log("  [ai] Calling OpenAI for prompt pack generation...");

    const response = await withRetry(
      () =>
        this.client.chat.completions.create({
          model: MODEL,
          temperature: 0.2,
          max_completion_tokens: 16384,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
        }),
      "generatePrompts",
    );

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { prompts?: unknown[] };

    if (!Array.isArray(parsed.prompts)) {
      throw new Error("OpenAI response missing 'prompts' array");
    }

    const validatedPrompts = this.validatePrompts(parsed.prompts, subtasks);

    return {
      generatedAt: new Date().toISOString(),
      prompts: validatedPrompts,
    };
  }

  private validatePrompts(raw: unknown[], subtasks: PlanStep[]): AgentPrompt[] {
    const validated: AgentPrompt[] = [];
    const stepIds = new Set(subtasks.map((s) => s.id));

    for (const item of raw) {
      const p = item as Record<string, unknown>;
      if (!p.stepId || !stepIds.has(p.stepId as string)) continue;

      const ctx = (p.context ?? {}) as Record<string, unknown>;

      validated.push({
        stepId: p.stepId as string,
        title: (p.title as string) ?? "",
        system: (p.system as string) ?? "",
        context: {
          prdSummary: (ctx.prdSummary as string) ?? "",
          impactedFiles: Array.isArray(ctx.impactedFiles)
            ? (ctx.impactedFiles as string[])
            : [],
          relevantRepoConventions: Array.isArray(ctx.relevantRepoConventions)
            ? (ctx.relevantRepoConventions as string[])
            : [],
          tokensOrConstraints: Array.isArray(ctx.tokensOrConstraints)
            ? (ctx.tokensOrConstraints as string[])
            : [],
          evidence: Array.isArray(ctx.evidence)
            ? (ctx.evidence as string[])
            : [],
        },
        instructions: Array.isArray(p.instructions)
          ? (p.instructions as string[])
          : [],
        guardrails: Array.isArray(p.guardrails)
          ? (p.guardrails as string[])
          : [],
        deliverables: Array.isArray(p.deliverables)
          ? (p.deliverables as string[])
          : [],
      });
    }

    console.log(`  [ai] Validated ${validated.length} agent prompts`);
    return validated;
  }

  // ─── Build Roadmap from Subtasks ─────────────────────────────────────

  buildRoadmap(
    subtasks: PlanStep[],
    prdHash: string,
    prdSource?: string,
  ): Roadmap {
    const allModify = new Set<string>();
    const allCreate = new Set<string>();
    const allTouch = new Set<string>();

    for (const s of subtasks) {
      s.files.modify.forEach((f) => allModify.add(f));
      s.files.create.forEach((f) => allCreate.add(f));
      s.files.touch.forEach((f) => allTouch.add(f));
    }

    // Derive risks
    const risks: Array<{
      severity: "low" | "medium" | "high";
      risk: string;
      mitigation: string[];
    }> = [];
    const totalFiles = allModify.size + allCreate.size + allTouch.size;

    if (totalFiles > 20) {
      risks.push({
        severity: "high",
        risk: `Large blast radius: ${totalFiles} files affected`,
        mitigation: [
          "Consider phased rollout",
          "Thorough code review required",
        ],
      });
    }
    if (subtasks.some((s) => s.area === "Auth")) {
      risks.push({
        severity: "high",
        risk: "Auth changes can break access control",
        mitigation: [
          "Test with multiple user roles",
          "Security review required",
        ],
      });
    }
    if (totalFiles > 5 && totalFiles <= 20) {
      risks.push({
        severity: "medium",
        risk: `Moderate blast radius: ${totalFiles} files`,
        mitigation: ["Incremental testing after each subtask"],
      });
    }

    return {
      prd: { hash: prdHash, source: prdSource },
      generatedAt: new Date().toISOString(),
      plan: subtasks,
      artifacts: {
        filesToModify: Array.from(allModify),
        filesAffected: Array.from(allTouch),
        filesToCreate: Array.from(allCreate),
        dependencies: [],
      },
      acceptanceCriteria: [
        "All TypeScript compilation errors are resolved (tsc exits 0)",
        "All existing tests continue to pass after changes",
        "New functionality matches PRD requirements",
      ],
      verification: [
        {
          type: "typecheck",
          instructions: ["Run: npx tsc --noEmit", "Expected: 0 errors"],
        },
        {
          type: "lint",
          instructions: [
            "Run: npx eslint src --ext .ts,.tsx",
            "Expected: 0 errors",
          ],
        },
        {
          type: "unit_test",
          instructions: ["Run: npm test", "Expected: all tests pass"],
        },
      ],
      risks,
      openQuestions: [],
      notes: [
        `Generated by OpenAIEngine (${MODEL})`,
        `${subtasks.length} implementation subtasks across ${new Set(subtasks.map((s) => s.area)).size} areas`,
        `Total estimated duration: ${subtasks.reduce((sum, s) => sum + s.durationHours, 0)} hours`,
      ],
    };
  }
}
