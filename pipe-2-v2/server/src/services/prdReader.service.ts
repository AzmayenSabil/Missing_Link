/**
 * prdReader.service.ts – Parse PRD text and compute metadata.
 *
 * Adapted from pipe-2/src/phase2/prdReader.ts for server usage.
 * Instead of reading from a file path, this accepts raw text from the API.
 */

import { PrdMeta } from "../contracts/phase2";
import { hashText, normalizeWhitespace } from "../utils/text";

export interface PrdContent {
  rawText: string;
  normalizedText: string;
  meta: PrdMeta;
}

/**
 * Process raw PRD text and return normalised content + metadata.
 */
export function processPrd(rawText: string, fileName: string): PrdContent {
  const stripped = stripMarkdownSyntax(rawText);
  const normalizedText = normalizeWhitespace(stripped);

  const meta: PrdMeta = {
    hash: hashText(rawText),
    source: fileName,
  };

  console.log(
    `  [prdReader] Processed PRD: ${fileName} (${rawText.length} chars, hash: ${meta.hash.slice(0, 8)}...)`,
  );

  return { rawText, normalizedText, meta };
}

/**
 * Strip common Markdown syntax to get plain prose.
 */
function stripMarkdownSyntax(text: string): string {
  return (
    text
      // Remove fenced code blocks (but keep the code text itself)
      .replace(/^```[\s\S]*?^```/gm, (match) => {
        return match.replace(/^```[^\n]*\n/m, "").replace(/^```\s*$/m, "");
      })
      // Remove inline code backticks
      .replace(/`([^`]+)`/g, "$1")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Remove markdown headings markers but keep text
      .replace(/^#{1,6}\s+/gm, "")
      // Remove blockquote markers
      .replace(/^>\s*/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove bold/italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      // Remove link markup, keep text
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Collapse multiple spaces
      .replace(/[ \t]+/g, " ")
  );
}
