/**
 * env.ts – Load environment variables from .env and expose typed config.
 */

import dotenv from "dotenv";
import path from "node:path";

// Load env vars for local development.
// Railway injects vars directly into process.env — dotenv is a no-op there.
// Try the pipe-specific .env first, then the repo root .env as a fallback.
// Neither call overrides vars already in process.env (Railway env vars are safe).
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });    // pipe-2-v2/.env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") }); // repo root .env

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  port: parseInt(process.env.PORT_PIPE2 ?? process.env.PORT ?? "3002", 10),
  outDir: path.resolve(__dirname, "../../../../out"),
} as const;

export function validateConfig(): void {
  if (!config.openaiApiKey) {
    console.warn(
      "WARNING: OPENAI_API_KEY is not set. The AI engine will fail.\n" +
        "Create a .env file in pipe-2-v2/ with: OPENAI_API_KEY=sk-...",
    );
  }
}
