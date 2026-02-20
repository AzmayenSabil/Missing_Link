/**
 * id.ts – Run ID and question ID generation utilities.
 */

/**
 * Generate a timestamp-based run ID matching existing pipe-2 format.
 * Format: YYYY-MM-DD_HH-mm-ss
 */
export function generateRunId(): string {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", "_")
    .replace(/:/g, "-");
}
