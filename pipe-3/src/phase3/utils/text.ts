/**
 * text.ts – PRD parsing and text normalization utilities.
 */

/**
 * Normalize PRD text: collapse excessive whitespace, strip HTML if any.
 */
export function normalizePrdText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ") // strip HTML tags
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract acceptance criteria from PRD text.
 * Looks for:
 *   - Lines starting with "AC-N:" or "Acceptance Criteria" sections
 *   - Headings followed by bullet lists
 *   - Lines containing "should", "must", "shall" (requirement language)
 */
export function extractAcceptanceCriteria(prdText: string): string[] {
  if (!prdText) return [];

  const criteria: string[] = [];
  const lines = prdText.split("\n");

  let inAcSection = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // Detect "Acceptance Criteria" section heading
    if (
      /acceptance criteria/i.test(line) &&
      (line.startsWith("#") || line.endsWith(":") || line.match(/^acceptance criteria\s*$/i))
    ) {
      inAcSection = true;
      continue;
    }

    // End AC section when hitting a different top-level heading
    if (inAcSection && line.startsWith("## ") && !/(acceptance|criteria)/i.test(line)) {
      inAcSection = false;
    }

    // Grab bullets inside AC section
    if (inAcSection && (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line))) {
      const text = line.replace(/^[-*\d.]+\s*/, "").trim();
      if (text.length > 10) criteria.push(text);
    }

    // Grab explicit AC-N: lines anywhere
    const acMatch = line.match(/^ac[-–—\s]\d+[:\s]+(.*)/i);
    if (acMatch && acMatch[1].trim().length > 5) {
      criteria.push(acMatch[1].trim());
    }

    // Grab GIVEN/WHEN/THEN BDD scenarios
    const gwtMatch = line.match(/^(given|when|then)\s+(.*)/i);
    if (gwtMatch) {
      criteria.push(line.trim());
    }
  }

  // Deduplicate while preserving order
  return [...new Set(criteria)].slice(0, 20);
}

/**
 * Extract the first non-empty heading from PRD text as a short title.
 */
export function extractPrdTitle(prdText: string): string {
  const match = prdText.match(/^#{1,2}\s+(.+)/m);
  if (match) return match[1].trim().slice(0, 80);
  const firstLine = prdText.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.trim().slice(0, 80);
}

/**
 * Extract feature keywords: bold text, heading labels, and capitalized phrases.
 */
export function extractFeatureKeywords(prdText: string): string[] {
  const keywords: string[] = [];

  // Bold text: **word** or __word__
  const boldMatches = prdText.matchAll(/\*\*([^*]{3,40})\*\*|__([^_]{3,40})__/g);
  for (const m of boldMatches) {
    keywords.push((m[1] ?? m[2]).trim());
  }

  // Heading text
  const headingMatches = prdText.matchAll(/^#{1,4}\s+(.+)$/gm);
  for (const m of headingMatches) {
    keywords.push(m[1].trim());
  }

  return [...new Set(keywords)].slice(0, 20);
}
