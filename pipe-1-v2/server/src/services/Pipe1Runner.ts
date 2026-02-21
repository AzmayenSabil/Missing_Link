import { spawn } from 'child_process';
import { env } from '../config/env';

export interface Pipe1RunResult {
  projectOutDir: string;
  gitHead?: string;
}

/**
 * Spawns the pipe-1 CLI as a subprocess to run all 15 analysis stages.
 *
 * Invocation:
 *   node <PIPE1_CLI> phase1 --git <repoUrl> --out <PIPE1_OUT_DIR> --projectId <id> [--openai-key <key>]
 *
 * Output lands at: PIPE1_OUT_DIR/<id>/
 *   project-dna/  — manifest.json, api-contract.json, naming-conventions.json, etc.
 *   indexes/      — exports.jsonl, imports.jsonl, depgraph.json, etc.
 */
export function runPipe1(projectId: string, repoUrl: string): Promise<Pipe1RunResult> {
  return new Promise((resolve, reject) => {
    const args: string[] = [
      env.PIPE1_CLI,
      'phase1',
      '--git', repoUrl,
      '--out', env.PIPE1_OUT_DIR,
      '--projectId', projectId,
    ];

    // Pass OpenAI key so the generateSystemPrompts stage can run
    if (env.OPENAI_API_KEY) {
      args.push('--openai-key', env.OPENAI_API_KEY);
    }

    console.log(`[Pipe1Runner] Starting: node ${args.join(' ')}`);

    const child = spawn('node', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // pipe-1 reads OPENAI_API_KEY from process.env as well
        OPENAI_API_KEY: env.OPENAI_API_KEY || '',
      },
    });

    let stdoutBuf = '';
    let stderrBuf = '';

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutBuf += text;
      // Stream to parent console for visibility
      process.stdout.write(`[pipe-1] ${text}`);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrBuf += text;
      process.stderr.write(`[pipe-1][err] ${text}`);
    });

    child.on('error', (err) => {
      reject(new Error(`pipe-1 process error: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const detail = stderrBuf.slice(-2000) || stdoutBuf.slice(-2000);
        return reject(new Error(`pipe-1 exited with code ${code}. Details: ${detail}`));
      }

      // Parse output directory from stdout: "Output directory: <path>"
      const outDirMatch = stdoutBuf.match(/Output directory:\s*(.+)/);
      const projectOutDir = outDirMatch?.[1]?.trim() ?? '';

      resolve({ projectOutDir });
    });
  });
}
