/**
 * id.ts – Run ID generation utility.
 */

/**
 * Generate a timestamp-based run ID.
 * Format: YYYY-MM-DD_HH-mm-ss
 */
export function generateRunId(): string {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", "_")
    .replace(/:/g, "-");
}
