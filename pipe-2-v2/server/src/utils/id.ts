/**
 * id.ts – Run ID and question ID generation utilities.
 */

/** Format current time in Europe/London (GMT/BST) as YYYY-MM-DD-HH-mm-ss */
function toBSTDatetime(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}-${get("hour")}-${get("minute")}-${get("second")}`;
}

/**
 * Extract just the project name slug from a pipe-1 project ID.
 * e.g. "redx-admin-panel-2026-02-21-14-30-45" → "redx-admin-panel"
 * Falls back to undefined for UUIDs or unrecognised formats.
 */
function extractProjectName(phase1ProjectId: string): string | undefined {
  // Strip trailing "-YYYY-MM-DD-HH-mm-ss"
  const stripped = phase1ProjectId.replace(
    /-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}(-\d+)?$/,
    "",
  );
  // Reject if nothing meaningful remains or if it still looks like a UUID
  if (!stripped || /^[0-9a-f]{8}-/.test(stripped)) return undefined;
  return stripped;
}

/**
 * Generate a human-readable run ID.
 * Format: <pipe1-project-name>-YYYY-MM-DD-HH-mm-ss
 * Falls back to just the timestamp when no project name is available.
 */
export function generateRunId(phase1ProjectId?: string): string {
  const datetime = toBSTDatetime();
  if (phase1ProjectId) {
    const name = extractProjectName(phase1ProjectId);
    if (name) return `${name}-${datetime}`;
  }
  return datetime;
}
