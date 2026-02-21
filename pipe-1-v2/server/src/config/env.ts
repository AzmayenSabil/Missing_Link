import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT_PIPE1 || process.env.PORT || '3001', 10),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
  // Repo-root out/pipe-1/ — same level as out/pipe-2, out/pipe-3
  // __dirname is dist/config, so ../../../../ → repo root
  PIPE1_OUT_DIR: process.env.PIPE1_OUT_DIR || path.resolve(__dirname, '../../../../out/pipe-1'),
  // Absolute path to pipe-1 CLI (the compiled dist/cli.js)
  PIPE1_CLI: process.env.PIPE1_CLI || path.resolve(__dirname, '../../../../pipe-1/dist/cli.js'),
};

if (!env.OPENAI_API_KEY) {
  console.warn('[env] Warning: OPENAI_API_KEY is not set. LLM enrichment stage (system prompts) will be skipped.');
}
