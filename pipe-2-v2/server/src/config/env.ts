/**
 * env.ts – Load environment variables from .env and expose typed config.
 */

import dotenv from "dotenv";
import path from "node:path";

// Load .env from pipe-2-v2 root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

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
