/**
 * promptGeneration.prompt.ts – System + user prompt for generating
 * agent coding prompts per subtask.
 */

import type { PlanStep } from "../../contracts/phase3";

export function buildPromptGenerationPrompt(
  subtasks: PlanStep[],
  prdText: string,
  codebaseContext: string,
  conventions: Record<string, unknown>,
  rules: Record<string, unknown>,
  tokens: Record<string, unknown>,
): { system: string; user: string } {
  // Format conventions for prompt — cap at 20 entries
  const conventionLines: string[] = [];
  for (const [k, v] of Object.entries(conventions).slice(0, 20)) {
    const val = JSON.stringify(v);
    conventionLines.push(`${k}: ${val.slice(0, 150)}`);
  }

  const ruleList = ((rules as { rules?: string[] }).rules ?? []).slice(0, 20);
  // Design tokens — cap at 20 entries
  const tokenLines: string[] = [];
  for (const [k, v] of Object.entries(tokens).slice(0, 20)) {
    tokenLines.push(`${k}: ${v}`);
  }

  return {
    system: `You are creating detailed coding prompts for an AI coding agent. For each implementation subtask, generate a complete, self-contained prompt that the agent can use to implement that specific piece of work.

Each prompt must be GROUNDED in the actual codebase — referencing real file paths, real conventions, and real design tokens.

For each subtask, produce an AgentPrompt with:

1. **system**: A concise system instruction telling the AI agent its role, the codebase stack, and the current focus area
2. **context**: Contains:
   - prdSummary: First 500 chars of the PRD
   - impactedFiles: The files this subtask touches (from modify + create)
   - relevantRepoConventions: Applicable coding conventions
   - tokensOrConstraints: Design tokens and CSS variables
   - evidence: Why these files are affected
3. **instructions**: Ordered list of specific coding tasks (copy from implementationChecklist, enhance with details)
4. **guardrails**: Do/don't rules to constrain the agent:
   - DO NOT modify files outside this step's scope
   - DO NOT remove existing exports without checking consumers
   - ALWAYS follow existing code style
   - Area-specific rules (e.g., "use existing API client" for API work)
5. **deliverables**: What the agent should produce (modified files, new files, test results)

You MUST respond with ONLY a valid JSON object:
{
  "prompts": [
    {
      "stepId": "step-types-1",
      "title": "Step title",
      "system": "You are a senior software engineer...",
      "context": {
        "prdSummary": "...",
        "impactedFiles": ["file1.ts"],
        "relevantRepoConventions": ["convention1"],
        "tokensOrConstraints": ["token1"],
        "evidence": ["reason1"]
      },
      "instructions": ["task1", "task2"],
      "guardrails": ["rule1", "rule2"],
      "deliverables": ["deliverable1"]
    }
  ]
}`,

    user: `## PRD
${prdText ? prdText.slice(0, 2000) : "(PRD text not available)"}

## Codebase Context
${codebaseContext}

## Repo Conventions
${conventionLines.length > 0 ? conventionLines.join("\n") : "None extracted"}

## Architectural Rules
${ruleList.length > 0 ? ruleList.map((r) => `- ${r}`).join("\n") : "None extracted"}

## Design Tokens
${tokenLines.length > 0 ? tokenLines.join("\n") : "None extracted"}

## Subtasks to Generate Prompts For
${JSON.stringify(subtasks)}

Generate one AgentPrompt per subtask. Return ONLY valid JSON.`,
  };
}
