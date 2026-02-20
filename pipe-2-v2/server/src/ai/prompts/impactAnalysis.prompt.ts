/**
 * impactAnalysis.prompt.ts – System + user prompt templates for
 * AI-powered impact analysis after clarifying questions are answered.
 */

import type { Question, Answer } from "../../contracts/phase2";

export function buildImpactAnalysisPrompt(
  prdText: string,
  codebaseContext: string,
  questionsAndAnswers: Array<{ question: Question; answer: Answer }>,
  allFilePaths: string[],
): { system: string; user: string } {
  const qaSection = questionsAndAnswers
    .map(
      (qa) =>
        `Q: ${qa.question.questionText}\nA: ${
          typeof qa.answer.value === "string"
            ? qa.answer.value
            : qa.answer.value.join(", ")
        }`,
    )
    .join("\n\n");

  return {
    system: `You are a senior technical architect performing impact analysis on an existing codebase. Given a PRD, codebase context, and answered clarifying questions, determine exactly which files will be affected by implementing this feature.

You MUST analyze these 7 dimensions:
1. FILES TO MODIFY: Existing files that need direct changes
2. FILES TO CREATE: New files that should be created (suggest path following existing conventions)
3. FLOW CHANGES: Files whose execution flow changes even if not directly modified
4. API DEPENDENCIES: Which API endpoints/services are affected
5. TEST DEPENDENCIES: Which test files need creation or modification
6. STATE DEPENDENCIES: Which Redux slices, stores, or state files are affected
7. SANITY TESTING: Which existing features might break and need regression testing

SCORING RULES:
- Each file gets a relevance score from 0.0 to 1.0
- "primary" role (score >= 0.6): directly modified or created for this feature
- "secondary" role (score >= 0.3): indirectly affected, need awareness
- "dependency" role: upstream dependencies that provide data/types to primary files
- "dependent" role: downstream consumers that may break if primary files change

AREA CLASSIFICATION:
Classify each file into exactly one area: "UI" | "Hooks" | "State" | "API/Service" | "Auth" | "Routing" | "Styling" | "Types" | "Tests" | "Build/Config" | "Unknown"

For each area that has impacted files, compute a confidence score (fraction of total impact weight, 0.0-1.0).

FILE PATHS: You may ONLY reference files from the provided file list, unless suggesting new files to create. For new files, follow existing folder structure conventions.

You MUST respond with ONLY a valid JSON object with this structure:
{
  "files": [
    {
      "path": "src/...",
      "score": 0.85,
      "role": "primary",
      "reasons": ["Reason 1", "Reason 2"],
      "evidence": {
        "matchedTerms": ["term1", "term2"],
        "matchedSymbols": ["SymbolName"],
        "depDistance": 0
      }
    }
  ],
  "areas": [
    {
      "area": "UI",
      "confidence": 0.45,
      "rationale": ["3 files in UI area", "Primary page component affected"]
    }
  ],
  "newFileSuggestions": [
    {
      "path": "src/pages/NewFeature.tsx",
      "reason": "New page component needed for the feature"
    }
  ],
  "notes": ["Note about the analysis..."]
}`,

    user: `## Codebase Context
${codebaseContext}

## PRD
${prdText}

## Clarifying Questions & PM Answers
${qaSection}

## Complete File List (existing files in the repo)
${allFilePaths.join("\n")}

Perform a thorough impact analysis across all 7 dimensions. Return ONLY valid JSON.`,
  };
}
