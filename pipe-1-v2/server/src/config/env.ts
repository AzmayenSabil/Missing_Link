import dotenv from "dotenv";
import path from "path";

// Load env vars for local development.
// Railway injects vars directly into process.env — dotenv is a no-op there.
// Try the pipe-specific .env first, then the repo root .env as a fallback.
// Neither call overrides vars already in process.env (Railway env vars are safe).
dotenv.config({ path: path.resolve(__dirname, "../../.env") });       // pipe-1-v2/server/.env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") }); // repo root .env

export const env = {
  PORT: parseInt(process.env.PORT_PIPE1 || process.env.PORT || "3001", 10),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o",
  // Repo-root out/pipe-1/ — same level as out/pipe-2, out/pipe-3
  // __dirname is dist/config, so ../../../../ → repo root
  PIPE1_OUT_DIR:
    process.env.PIPE1_OUT_DIR ||
    path.resolve(__dirname, "../../../../out/pipe-1"),
  // Absolute path to pipe-1 CLI (the compiled dist/cli.js)
  PIPE1_CLI:
    process.env.PIPE1_CLI ||
    path.resolve(__dirname, "../../../../pipe-1/dist/cli.js"),
};

if (!env.OPENAI_API_KEY) {
  console.warn(
    "[env] Warning: OPENAI_API_KEY is not set. LLM enrichment stage (system prompts) will be skipped.",
  );
}
