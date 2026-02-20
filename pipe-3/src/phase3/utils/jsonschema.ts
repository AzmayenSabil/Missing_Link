/**
 * jsonschema.ts – Lightweight runtime validation helpers.
 *
 * Uses plain TypeScript type guards – no external validation library required.
 * Returns a list of validation errors (empty = valid).
 */

import type { Roadmap, AgentPromptPack, Phase3RunMeta } from "../../contracts/phase3";

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireString(obj: Record<string, unknown>, key: string, path: string): string[] {
  if (!isString(obj[key])) return [`${path}.${key} must be a string`];
  return [];
}

function requireArray(obj: Record<string, unknown>, key: string, path: string): string[] {
  if (!isArray(obj[key])) return [`${path}.${key} must be an array`];
  return [];
}

// ---------------------------------------------------------------------------
// PlanStep validation
// ---------------------------------------------------------------------------

function validatePlanStep(step: unknown, idx: number): string[] {
  const errors: string[] = [];
  const path = `plan[${idx}]`;

  if (!isObject(step)) return [`${path} must be an object`];

  errors.push(...requireString(step, "id", path));
  errors.push(...requireString(step, "title", path));
  errors.push(...requireString(step, "description", path));
  errors.push(...requireString(step, "area", path));
  errors.push(...requireString(step, "kind", path));

  if (!isArray(step["dependsOnStepIds"])) {
    errors.push(`${path}.dependsOnStepIds must be an array`);
  }
  if (!isArray(step["rationale"])) {
    errors.push(`${path}.rationale must be an array`);
  }
  if (!isArray(step["implementationChecklist"])) {
    errors.push(`${path}.implementationChecklist must be an array`);
  }
  if (!isArray(step["doneWhen"])) {
    errors.push(`${path}.doneWhen must be an array`);
  }
  if (!isObject(step["files"])) {
    errors.push(`${path}.files must be an object`);
  } else {
    const files = step["files"] as Record<string, unknown>;
    if (!isArray(files["modify"])) errors.push(`${path}.files.modify must be an array`);
    if (!isArray(files["create"])) errors.push(`${path}.files.create must be an array`);
    if (!isArray(files["touch"])) errors.push(`${path}.files.touch must be an array`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Roadmap validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRoadmap(roadmap: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(roadmap)) {
    return { valid: false, errors: ["roadmap must be an object"], warnings: [] };
  }

  errors.push(...requireString(roadmap, "generatedAt", "roadmap"));

  // prd
  if (!isObject(roadmap["prd"])) {
    errors.push("roadmap.prd must be an object");
  } else {
    const prd = roadmap["prd"] as Record<string, unknown>;
    errors.push(...requireString(prd, "hash", "roadmap.prd"));
  }

  // plan
  errors.push(...requireArray(roadmap, "plan", "roadmap"));
  if (isArray(roadmap["plan"])) {
    if ((roadmap["plan"] as unknown[]).length === 0) {
      errors.push("roadmap.plan must contain at least 1 step");
    }
    for (let i = 0; i < (roadmap["plan"] as unknown[]).length; i++) {
      errors.push(...validatePlanStep((roadmap["plan"] as unknown[])[i], i));
    }
  }

  // artifacts
  if (!isObject(roadmap["artifacts"])) {
    errors.push("roadmap.artifacts must be an object");
  }

  // acceptance criteria
  errors.push(...requireArray(roadmap, "acceptanceCriteria", "roadmap"));
  if (isArray(roadmap["acceptanceCriteria"]) && (roadmap["acceptanceCriteria"] as unknown[]).length === 0) {
    warnings.push("roadmap.acceptanceCriteria is empty – consider adding criteria");
  }

  // verification
  errors.push(...requireArray(roadmap, "verification", "roadmap"));
  if (isArray(roadmap["verification"]) && (roadmap["verification"] as unknown[]).length === 0) {
    errors.push("roadmap.verification must contain at least 1 item");
  }

  // Cross-reference: all dependsOnStepIds must resolve
  if (isArray(roadmap["plan"])) {
    const knownIds = new Set(
      (roadmap["plan"] as Array<Record<string, unknown>>)
        .filter((s) => isString(s["id"]))
        .map((s) => s["id"] as string)
    );
    for (const step of roadmap["plan"] as Array<Record<string, unknown>>) {
      if (isArray(step["dependsOnStepIds"])) {
        for (const depId of step["dependsOnStepIds"] as unknown[]) {
          if (isString(depId) && !knownIds.has(depId)) {
            errors.push(
              `Step "${step["id"]}" depends on unknown step id "${depId}"`
            );
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// AgentPromptPack validation
// ---------------------------------------------------------------------------

export function validateAgentPromptPack(pack: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(pack)) {
    return { valid: false, errors: ["promptPack must be an object"], warnings: [] };
  }

  errors.push(...requireString(pack, "generatedAt", "promptPack"));
  errors.push(...requireArray(pack, "prompts", "promptPack"));

  if (isArray(pack["prompts"])) {
    if ((pack["prompts"] as unknown[]).length === 0) {
      warnings.push("promptPack.prompts is empty");
    }
    for (let i = 0; i < (pack["prompts"] as unknown[]).length; i++) {
      const prompt = (pack["prompts"] as unknown[])[i];
      const path = `prompts[${i}]`;
      if (!isObject(prompt)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      const p = prompt as Record<string, unknown>;
      errors.push(...requireString(p, "stepId", path));
      errors.push(...requireString(p, "title", path));
      errors.push(...requireString(p, "system", path));
      errors.push(...requireArray(p, "instructions", path));
      errors.push(...requireArray(p, "guardrails", path));
      errors.push(...requireArray(p, "deliverables", path));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// Type-only usage to satisfy exports
export type { Roadmap, AgentPromptPack, Phase3RunMeta };
