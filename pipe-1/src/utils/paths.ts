import path from "node:path";

export function toPosix(inputPath: string): string {
  return inputPath.split(path.sep).join("/");
}

export function repoRelativePath(
  repoRoot: string,
  absolutePath: string,
): string {
  return toPosix(path.relative(repoRoot, absolutePath));
}

export function sanitizeProjectId(projectId: string): string {
  return projectId
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function timestampYmdHms(date = new Date()): string {
  const yyyy = `${date.getFullYear()}`;
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");
  const ss = `${date.getSeconds()}`.padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

export function deriveProjectId(
  repoPath: string,
  explicitProjectId?: string,
): string {
  if (explicitProjectId && explicitProjectId.trim().length > 0) {
    return sanitizeProjectId(explicitProjectId.trim());
  }

  const repoName = path.basename(path.resolve(repoPath));
  return sanitizeProjectId(`${repoName}-${timestampYmdHms()}`);
}
