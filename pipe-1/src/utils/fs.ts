import fs from "node:fs";
import path from "node:path";

export async function mkdirp(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await mkdirp(path.dirname(filePath));
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function writeJsonl(
  filePath: string,
  rows: unknown[],
): Promise<void> {
  await mkdirp(path.dirname(filePath));
  const payload = rows.map((row) => JSON.stringify(row)).join("\n");
  await fs.promises.writeFile(
    filePath,
    payload.length > 0 ? `${payload}\n` : "",
    "utf8",
  );
}

export async function readTextSafe(
  filePath: string,
  maxChars = 2_000_000,
): Promise<string | undefined> {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    return content.slice(0, maxChars);
  } catch {
    return undefined;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonIfPossible<T>(
  filePath: string,
): Promise<T | undefined> {
  const raw = await readTextSafe(filePath, 1_000_000);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
