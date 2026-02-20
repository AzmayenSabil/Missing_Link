/**
 * validatePlan.ts – Post-generation plan validation.
 *
 * Checks:
 * 1. Schema integrity (via jsonschema helpers).
 * 2. File-path grounding: every file referenced in modify[] must exist in
 *    the repo DNA (phase-1 allFiles) OR appear in the create[] lists.
 * 3. Dependency resolution: no step may depend on a non-existent step id.
 * 4. At least one verification item exists.
 */

import type { Roadmap, AgentPromptPack, Phase1Summary } from "../contracts/phase3";
import {
  validateRoadmap,
  validateAgentPromptPack,
  type ValidationResult,
} from "./utils/jsonschema";

export interface PlanValidationResult {
  valid: boolean;
  schemaErrors: string[];
  groundingWarnings: string[];
  allWarnings: string[];
}

/**
 * Validate the generated roadmap and prompt pack.
 *
 * @param roadmap     – the generated roadmap
 * @param promptPack  – the generated agent prompt pack
 * @param phase1      – loaded phase-1 summary (used for file-path grounding)
 */
export function validatePlan(
  roadmap: Roadmap,
  promptPack: AgentPromptPack,
  phase1: Phase1Summary
): PlanValidationResult {
  const schemaErrors: string[] = [];
  const groundingWarnings: string[] = [];

  // ── 1. Schema validation ──────────────────────────────────────────────
  const roadmapResult: ValidationResult = validateRoadmap(roadmap);
  schemaErrors.push(...roadmapResult.errors);

  const packResult: ValidationResult = validateAgentPromptPack(promptPack);
  schemaErrors.push(...packResult.errors);

  // ── 2. File-path grounding ────────────────────────────────────────────
  if (phase1.allFiles.length > 0) {
    const repoFileSet = new Set(phase1.allFiles);

    // Files that will be created are valid targets too
    const filesToCreate = new Set<string>([
      ...roadmap.artifacts.filesToCreate,
      ...roadmap.plan.flatMap((s) => s.files.create),
    ]);

    for (const step of roadmap.plan) {
      for (const modifyPath of step.files.modify) {
        if (!repoFileSet.has(modifyPath) && !filesToCreate.has(modifyPath)) {
          groundingWarnings.push(
            `Step "${step.id}" references modify file "${modifyPath}" which was not found in the repo DNA`
          );
        }
      }
    }
  }

  // ── 3. Step dependency resolution ────────────────────────────────────
  const knownIds = new Set(roadmap.plan.map((s) => s.id));
  for (const step of roadmap.plan) {
    for (const depId of step.dependsOnStepIds) {
      if (!knownIds.has(depId)) {
        schemaErrors.push(
          `Step "${step.id}" has unknown dependency "${depId}"`
        );
      }
    }
  }

  // ── 4. Verify at least one verification item ──────────────────────────
  if (roadmap.verification.length === 0) {
    schemaErrors.push(
      "Roadmap must contain at least one verification item"
    );
  }

  // ── 5. Prompt-to-step alignment ───────────────────────────────────────
  const promptStepIds = new Set(promptPack.prompts.map((p) => p.stepId));
  for (const step of roadmap.plan) {
    if (!promptStepIds.has(step.id)) {
      groundingWarnings.push(
        `Step "${step.id}" has no corresponding agent prompt`
      );
    }
  }

  const allWarnings = [
    ...roadmapResult.warnings,
    ...packResult.warnings,
    ...groundingWarnings,
  ];

  return {
    valid: schemaErrors.length === 0,
    schemaErrors,
    groundingWarnings,
    allWarnings,
  };
}
