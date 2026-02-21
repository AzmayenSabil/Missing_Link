/**
 * contextBuilder.ts – Assembles pipe-1 DNA + pipe-2 impact data
 * into a prompt-friendly context string for OpenAI calls.
 */

import type {
  Phase1Summary,
  Phase2Summary,
  ImpactAnalysis,
} from "../../contracts/phase3";

/**
 * Build context from phase-1 project DNA for LLM consumption.
 */
export function buildCodebaseContext(phase1: Phase1Summary): string {
  const sections: string[] = [];

  // Project overview from manifest
  if (phase1.projectDna.length > 0) {
    const manifest = phase1.projectDna[0] as Record<string, unknown>;
    const stack = manifest.stack as Record<string, boolean> | undefined;
    const techs: string[] = [];
    if (stack) {
      for (const [tech, present] of Object.entries(stack)) {
        if (present) techs.push(tech);
      }
    }
    const fingerprint = manifest.fingerprint as
      | Record<string, unknown>
      | undefined;
    sections.push(
      [
        "## Project Overview",
        `Stack: ${techs.length > 0 ? techs.join(", ") : "unknown"}`,
        `Total files: ${fingerprint?.totalFiles ?? "unknown"}`,
      ].join("\n"),
    );
  }

  // Conventions
  const convEntries = Object.entries(phase1.conventions);
  if (convEntries.length > 0) {
    const lines = convEntries
      .slice(0, 20)
      .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`);
    sections.push(["## Conventions", ...lines].join("\n"));
  }

  // Rules
  const ruleList = (phase1.rules as { rules?: string[] }).rules;
  if (ruleList && ruleList.length > 0) {
    sections.push(
      ["## Architectural Rules", ...ruleList.map((r) => `- ${r}`)].join("\n"),
    );
  }

  // Tokens
  const tokenEntries = Object.entries(phase1.tokens);
  if (tokenEntries.length > 0) {
    const lines = tokenEntries.slice(0, 20).map(([k, v]) => `  ${k}: ${v}`);
    sections.push(["## Design Tokens", ...lines].join("\n"));
  }

  // File list
  if (phase1.allFiles.length > 0) {
    sections.push(
      ["## All File Paths", ...phase1.allFiles.map((f) => `  ${f}`)].join("\n"),
    );
  }

  // Copilot instructions (project-specific AI guidelines)
  if (phase1.copilotInstructions) {
    sections.push(
      [
        "## Copilot Instructions (Project-Specific Guidelines)",
        phase1.copilotInstructions.trim(),
      ].join("\n"),
    );
  }

  // System prompts
  const systemPromptEntries = Object.entries(phase1.systemPrompts);
  if (systemPromptEntries.length > 0) {
    const lines = systemPromptEntries.map(
      ([k, v]) => `  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`,
    );
    sections.push(["## System Prompts / Behaviour Rules", ...lines].join("\n"));
  }

  return sections.filter(Boolean).join("\n\n");
}

/**
 * Build impact analysis context for LLM consumption.
 */
export function buildImpactContext(
  phase2: Phase2Summary,
  impact: ImpactAnalysis,
): string {
  const sections: string[] = [];

  // Impact summary
  const primary = impact.files.filter((f) => f.role === "primary");
  const secondary = impact.files.filter((f) => f.role === "secondary");
  sections.push(
    [
      "## Impact Analysis Summary",
      `Primary files: ${primary.length}`,
      `Secondary files: ${secondary.length}`,
      `Total impacted: ${impact.files.length}`,
    ].join("\n"),
  );

  // Area breakdown
  if (impact.summary.areas.length > 0) {
    const lines = impact.summary.areas.map(
      (a) =>
        `  ${a.area}: ${(a.confidence * 100).toFixed(0)}% confidence — ${a.rationale.join("; ")}`,
    );
    sections.push(["## Impacted Areas", ...lines].join("\n"));
  }

  // Files with scores
  const sortedFiles = [...impact.files].sort((a, b) => b.score - a.score);
  const fileLines = sortedFiles.map(
    (f) =>
      `  [${f.score.toFixed(2)}] ${f.role} — ${f.path}: ${f.reasons.join("; ")}`,
  );
  sections.push(["## Impacted Files (by score)", ...fileLines].join("\n"));

  // New file suggestions
  if (phase2.newFilesSuggested.length > 0) {
    sections.push(
      [
        "## Suggested New Files",
        ...phase2.newFilesSuggested.map((f) => `  ${f}`),
      ].join("\n"),
    );
  }

  // Q&A pairs
  if (phase2.questions.length > 0 && phase2.answers.length > 0) {
    const qaLines: string[] = [];
    for (const q of phase2.questions) {
      const a = phase2.answers.find((ans) => ans.questionId === q.id);
      const answerText = a
        ? Array.isArray(a.value)
          ? a.value.join(", ")
          : a.value
        : "Not answered";
      qaLines.push(`Q: ${q.questionText}\nA: ${answerText}`);
    }
    sections.push(["## Clarifying Q&A", ...qaLines].join("\n\n"));
  }

  // Notes
  if (phase2.notes.length > 0) {
    sections.push(
      ["## Analysis Notes", ...phase2.notes.map((n) => `- ${n}`)].join("\n"),
    );
  }

  return sections.filter(Boolean).join("\n\n");
}
