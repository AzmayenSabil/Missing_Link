/**
 * prdReader.ts – Read a PRD file from disk and normalise its content.
 *
 * Supports:
 *  - Plain text (.txt)
 *  - Markdown (.md, .markdown)
 *  - Strips HTML tags from Markdown where present
 *  - Returns raw text and a hash for stable identification
 */

import fs from "node:fs";
import path from "node:path";
import { PrdMeta } from "../contracts/phase2";
import { hashText, normalizeWhitespace } from "./utils/text";

export interface PrdContent {
  rawText: string;
  normalizedText: string;
  meta: PrdMeta;
}

/**
 * Read a PRD file and return its normalised content + metadata.
 * Throws if the file cannot be read.
 */
export function readPrd(filePath: string): PrdContent {
  const abs = path.resolve(filePath);

  if (!fs.existsSync(abs)) {
    throw new Error(`PRD file not found: ${abs}`);
  }

  const stat = fs.statSync(abs);
  if (!stat.isFile()) {
    throw new Error(`PRD path is not a file: ${abs}`);
  }

  const rawText = fs.readFileSync(abs, "utf8");
  const stripped = stripMarkdownSyntax(rawText);
  const normalizedText = normalizeWhitespace(stripped);

  const meta: PrdMeta = {
    hash: hashText(rawText),
    source: filePath,
  };

  console.log(
    `  [prdReader] Read PRD: ${path.basename(abs)} (${rawText.length} chars, hash: ${meta.hash.slice(0, 8)}…)`,
  );

  return { rawText, normalizedText, meta };
}

/**
 * Strip common Markdown syntax to get plain prose.
 * This is a lightweight stripping – not a full parser.
 */
function stripMarkdownSyntax(text: string): string {
  return (
    text
      // Remove fenced code blocks (but keep the code text itself for token extraction)
      .replace(/^```[\s\S]*?^```/gm, (match) => {
        // strip the fences, keep the content
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
