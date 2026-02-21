/**
 * sessionManager.service.ts – In-memory run/session state machine.
 *
 * Each browser session creates one "run" that tracks the full lifecycle:
 *   created → generating_questions → asking_questions → generating_impact → complete
 */

import type {
  Question,
  Answer,
  ImpactAnalysis,
  PrdMeta,
  Phase1Indexes,
} from "../contracts/phase2";
import type { RunStatus } from "../contracts/api";
import { generateRunId } from "../utils/id";

// ---------------------------------------------------------------------------
// Session shape
// ---------------------------------------------------------------------------

export interface RunSession {
  runId: string;
  phase1RunId: string;
  phase1Dir: string;
  prdText: string;
  prdFileName: string;
  prdMeta: PrdMeta;
  codebaseContext: string;
  status: RunStatus;
  error?: string;
  createdAt: string;

  // Phase-1 loaded data
  indexes: Phase1Indexes;
  allFilePaths: string[];

  // Questions
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;

  // Impact
  impactAnalysis: ImpactAnalysis | null;

  // Output
  outputWritten: boolean;
  outputDir: string;
}

// ---------------------------------------------------------------------------
// Create session params
// ---------------------------------------------------------------------------

export interface CreateSessionParams {
  phase1RunId: string;
  phase1Dir: string;
  prdText: string;
  prdFileName: string;
  prdMeta: PrdMeta;
  codebaseContext: string;
  indexes: Phase1Indexes;
  allFilePaths: string[];
  outRootDir: string;
}

// ---------------------------------------------------------------------------
// Session Manager
// ---------------------------------------------------------------------------

class SessionManager {
  private sessions: Map<string, RunSession> = new Map();

  createSession(params: CreateSessionParams): RunSession {
    const runId = generateRunId(params.phase1RunId);
    const session: RunSession = {
      runId,
      phase1RunId: params.phase1RunId,
      phase1Dir: params.phase1Dir,
      prdText: params.prdText,
      prdFileName: params.prdFileName,
      prdMeta: params.prdMeta,
      codebaseContext: params.codebaseContext,
      status: "created",
      createdAt: new Date().toISOString(),
      indexes: params.indexes,
      allFilePaths: params.allFilePaths,
      questions: [],
      answers: [],
      currentQuestionIndex: 0,
      impactAnalysis: null,
      outputWritten: false,
      outputDir: `${params.outRootDir}/${runId}`,
    };

    this.sessions.set(runId, session);
    console.log(`  [sessionManager] Created session: ${runId}`);
    return session;
  }

  getSession(runId: string): RunSession | undefined {
    return this.sessions.get(runId);
  }

  updateStatus(runId: string, status: RunStatus, error?: string): void {
    const session = this.sessions.get(runId);
    if (!session) throw new Error(`Session not found: ${runId}`);
    session.status = status;
    if (error) session.error = error;
  }

  setQuestions(runId: string, questions: Question[]): void {
    const session = this.sessions.get(runId);
    if (!session) throw new Error(`Session not found: ${runId}`);
    session.questions = questions;
    session.currentQuestionIndex = 0;
  }

  addAnswer(runId: string, answer: Answer): void {
    const session = this.sessions.get(runId);
    if (!session) throw new Error(`Session not found: ${runId}`);
    session.answers.push(answer);
    session.currentQuestionIndex = session.answers.length;
  }

  setImpactAnalysis(runId: string, impact: ImpactAnalysis): void {
    const session = this.sessions.get(runId);
    if (!session) throw new Error(`Session not found: ${runId}`);
    session.impactAnalysis = impact;
  }

  markOutputWritten(runId: string): void {
    const session = this.sessions.get(runId);
    if (!session) throw new Error(`Session not found: ${runId}`);
    session.outputWritten = true;
  }

  listSessions(): RunSession[] {
    return [...this.sessions.values()];
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
