/**
 * scoring.ts – File scoring utilities.
 * Computes relevance scores for impacted files and applies depth-decay for
 * graph-expanded files.
 *
 * All functions are pure and side-effect-free.
 */

export interface ScoredFile {
  path: string;
  score: number;
  matchedTerms: string[];
  matchedSymbols: string[];
  depDistance: number;
}

// Decay factor applied per dependency hop
const DEPTH_DECAY = 0.5;

// Base score for a direct keyword match in search index text
const SEARCH_TERM_SCORE = 0.4;

// Base score for a direct symbol name match in symbol index
const SYMBOL_MATCH_SCORE = 0.6;

/**
 * Compute a raw relevance score for a file given the number of term hits,
 * symbol hits, and graph-expansion depth.
 *
 * Score formula:
 *   raw = (termHits * SEARCH_TERM_SCORE + symbolHits * SYMBOL_MATCH_SCORE) * decay
 *
 * where decay = DEPTH_DECAY ^ depDistance
 *
 * The returned score is NOT yet normalised – call normaliseScores() after collecting
 * all raw scores.
 */
export function computeRawScore(
  termHits: number,
  symbolHits: number,
  depDistance: number,
): number {
  const decay = Math.pow(DEPTH_DECAY, depDistance);
  return (
    (termHits * SEARCH_TERM_SCORE + symbolHits * SYMBOL_MATCH_SCORE) * decay
  );
}

/**
 * Normalise an array of raw scores so the maximum becomes 1.0.
 * Files with score ≤ 0 are preserved but kept at 0.
 */
export function normaliseScores(scored: ScoredFile[]): ScoredFile[] {
  const max = Math.max(...scored.map((s) => s.score), 0);
  if (max === 0) return scored;
  return scored.map((s) => ({ ...s, score: Math.min(1, s.score / max) }));
}

/**
 * Deduplicate a list of scored files by path, keeping the highest score for
 * each path and merging matchedTerms / matchedSymbols.
 */
export function mergeScored(list: ScoredFile[]): ScoredFile[] {
  const map = new Map<string, ScoredFile>();
  for (const item of list) {
    const existing = map.get(item.path);
    if (!existing) {
      map.set(item.path, { ...item });
    } else {
      map.set(item.path, {
        path: item.path,
        score: Math.max(existing.score, item.score),
        matchedTerms: [
          ...new Set([...existing.matchedTerms, ...item.matchedTerms]),
        ],
        matchedSymbols: [
          ...new Set([...existing.matchedSymbols, ...item.matchedSymbols]),
        ],
        depDistance: Math.min(existing.depDistance, item.depDistance),
      });
    }
  }
  return [...map.values()];
}

/**
 * Sort scored files by score descending, then alphabetically by path.
 */
export function sortByScore(files: ScoredFile[]): ScoredFile[] {
  return [...files].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.path.localeCompare(b.path);
  });
}

/**
 * Apply a minimum score threshold, discarding files below it.
 */
export function filterByThreshold(
  files: ScoredFile[],
  threshold: number,
): ScoredFile[] {
  return files.filter((f) => f.score >= threshold);
}
