export interface SnippetResult {
  startLine: number;
  endLine: number;
  text: string;
}

export function getLineRangeSnippet(
  text: string,
  startLine: number,
  endLine: number,
  maxLines = 60,
): SnippetResult {
  const lines = text.split(/\r?\n/);
  const boundedStart = Math.max(1, startLine);
  const boundedEnd = Math.min(lines.length, Math.max(boundedStart, endLine));
  const currentSize = boundedEnd - boundedStart + 1;

  let finalStart = boundedStart;
  let finalEnd = boundedEnd;

  if (currentSize > maxLines) {
    finalEnd = finalStart + maxLines - 1;
  }

  const snippetText = lines.slice(finalStart - 1, finalEnd).join("\n");
  return { startLine: finalStart, endLine: finalEnd, text: snippetText };
}

export function getSnippetAroundIndex(
  text: string,
  index: number,
  preferredLines = 24,
): SnippetResult {
  const lines = text.split(/\r?\n/);

  let running = 0;
  let targetLine = 1;
  for (let i = 0; i < lines.length; i += 1) {
    running += lines[i].length + 1;
    if (running >= index) {
      targetLine = i + 1;
      break;
    }
  }

  const half = Math.floor(preferredLines / 2);
  const startLine = Math.max(1, targetLine - half);
  const endLine = Math.min(lines.length, startLine + preferredLines - 1);

  return {
    startLine,
    endLine,
    text: lines.slice(startLine - 1, endLine).join("\n"),
  };
}
