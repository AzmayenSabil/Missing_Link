/**
 * derivePlan.ts – Transforms loaded phase-1 and phase-2 data into a
 * PlanningInput ready for consumption by any PlanningEngine.
 *
 * This module does NOT contain planning logic itself; that lives in the
 * engine implementations. Its job is data-assembly and normalization.
 */

import type {
  PlanningInput,
  Phase1Summary,
  Phase2Summary,
} from "../contracts/phase3";

export interface DerivePlanOptions {
  phase1: Phase1Summary;
  phase2: Phase2Summary;
  /** Optional re-read PRD text */
  prdText?: string | null;
}

/**
 * Assemble a PlanningInput from raw loaded summaries.
 * Validates that the minimum required data is present and logs warnings
 * for optional-but-useful missing data.
 */
export function assemblePlanningInput(opts: DerivePlanOptions): {
  input: PlanningInput;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { phase1, phase2, prdText } = opts;

  if (!phase2.prdHash) {
    warnings.push(
      "Phase-2 impact analysis does not contain a PRD hash – roadmap prd.hash will be empty"
    );
  }

  if (phase2.impactedFiles.length === 0) {
    warnings.push(
      "Phase-2 impact analysis contains 0 impacted files – plan may be skeletal"
    );
  }

  if (phase2.areaSummaries.length === 0) {
    warnings.push(
      "Phase-2 area summaries are empty – defaulting to UI+Types areas"
    );
  }

  if (phase1.allFiles.length === 0) {
    warnings.push(
      "Phase-1 file list is empty – file-path validation will be skipped"
    );
  }

  if (Object.keys(phase1.conventions).length === 0) {
    warnings.push(
      "No conventions loaded from phase-1 – agent prompts will use generic conventions"
    );
  }

  if (Object.keys(phase1.tokens).length === 0) {
    warnings.push(
      "No design tokens loaded from phase-1 – styling constraints will be generic"
    );
  }

  const input: PlanningInput = {
    phase1,
    phase2,
    prdText: prdText ?? "",
  };

  return { input, warnings };
}
