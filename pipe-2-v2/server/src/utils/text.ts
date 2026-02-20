/**
 * text.ts – Text tokenisation and PRD keyword extraction utilities.
 * Pure functions – no side effects, easily testable.
 */

// ---------------------------------------------------------------------------
// Stop words to filter out of keyword extraction
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "must",
  "this", "that", "these", "those", "it", "its", "we", "our", "you",
  "your", "they", "their", "he", "she", "as", "if", "not", "no", "so",
  "then", "than", "when", "where", "which", "who", "how", "what", "why",
  "all", "any", "each", "every", "both", "few", "more", "most", "other",
  "some", "such", "into", "through", "during", "before", "after", "above",
  "below", "between", "out", "up", "down", "also", "very", "just", "about",
  "only", "well", "new", "same", "get", "use", "used", "using", "make",
  "made", "per", "via", "etc",
]);

// ---------------------------------------------------------------------------
// Ambiguity signals – trigger clarifying questions when found
// ---------------------------------------------------------------------------
export const AMBIGUITY_SIGNALS = [
  "should", "maybe", "tbd", "tba", "unknown", "unclear", "perhaps",
  "possibly", "to be decided", "to be determined", "to be confirmed",
  "tbc", "n/a", "?",
];

// ---------------------------------------------------------------------------
// Core tokeniser
// ---------------------------------------------------------------------------

/**
 * Split text into lowercase word tokens, removing punctuation.
 * Returns only tokens with 2+ characters after filtering stop words.
 */
export function tokenize(text: string): string[] {
  return text
    .replace(/[`'"()[\]{}<>]/g, " ")
    .split(/[\s,;:.!?\-\/\\|@#$%^&*+=~]+/)
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Extract unique significant keywords from PRD text.
 * Filters stop-words and very short tokens.
 */
export function extractKeywords(text: string): string[] {
  const tokens = tokenize(text);
  return [...new Set(tokens)];
}

/**
 * Extract code-like identifiers: camelCase, PascalCase, snake_case, SCREAMING_SNAKE.
 * These are good candidates for direct symbol lookups.
 */
export function extractCodeTokens(text: string): string[] {
  const patterns = [
    /\b[A-Z][a-zA-Z0-9]{2,}\b/g, // PascalCase
    /\b[a-z][a-zA-Z0-9]{2,}[A-Z][a-zA-Z0-9]*\b/g, // camelCase
    /\b[a-z][a-z0-9]+_[a-z][a-z0-9_]+\b/g, // snake_case
    /\b[A-Z][A-Z0-9_]{2,}\b/g, // SCREAMING_SNAKE
  ];

  const found = new Set<string>();
  for (const pattern of patterns) {
    const matches = text.match(pattern) ?? [];
    for (const m of matches) {
      found.add(m);
    }
  }
  return [...found];
}

/**
 * Detect ambiguity signals in PRD text (case-insensitive).
 * Returns the list of matched signals.
 */
export function detectAmbiguitySignals(text: string): string[] {
  const lower = text.toLowerCase();
  return AMBIGUITY_SIGNALS.filter((signal) => lower.includes(signal));
}

/**
 * Combine extractKeywords and extractCodeTokens into a single deduplicated set.
 */
export function extractAllTokens(text: string): string[] {
  const keywords = extractKeywords(text);
  const code = extractCodeTokens(text);
  return [...new Set([...keywords, ...code])];
}

/**
 * Compute a simple SHA-256 hex hash using Node crypto.
 * Returns a 64-char hex string.
 */
export function hashText(text: string): string {
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * Normalise line endings and collapse excessive blank lines.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
