/**
 * sessionManager.service.ts – In-memory session state for pipe-3-v2 runs.
 */

import type {
  RunStatus,
  Phase1Summary,
  Phase2Summary,
  ImpactAnalysis,
  PlanStep,
  AgentPromptPack,
  Roadmap,
} from "../contracts/phase3";

export interface RunSession {
  runId: string;
  phase1RunId: string;
  phase1Dir: string;
  phase2RunId: string;
  phase2Dir: string;
  status: RunStatus;
  error?: string;
  createdAt: string;

  // Loaded data
  phase1Summary: Phase1Summary | null;
  phase2Summary: Phase2Summary | null;
  impact: ImpactAnalysis | null;
  prdText: string | null;

  // Generated data
  subtasks: PlanStep[] | null;
  roadmap: Roadmap | null;
  promptPack: AgentPromptPack | null;

  // Output tracking
  outputWritten: boolean;
  outputDir: string;
}

class SessionManager {
  private sessions = new Map<string, RunSession>();

  createSession(params: {
    runId: string;
    phase1RunId: string;
    phase1Dir: string;
    phase2RunId: string;
    phase2Dir: string;
    outputDir: string;
  }): RunSession {
    const session: RunSession = {
      ...params,
      status: "created",
      createdAt: new Date().toISOString(),
      phase1Summary: null,
      phase2Summary: null,
      impact: null,
      prdText: null,
      subtasks: null,
      roadmap: null,
      promptPack: null,
      outputWritten: false,
      outputDir: params.outputDir,
    };
    this.sessions.set(params.runId, session);
    return session;
  }

  getSession(runId: string): RunSession | undefined {
    return this.sessions.get(runId);
  }

  updateStatus(runId: string, status: RunStatus, error?: string): void {
    const session = this.sessions.get(runId);
    if (!session) return;
    session.status = status;
    if (error) session.error = error;
  }

  setLoadedData(
    runId: string,
    phase1Summary: Phase1Summary,
    phase2Summary: Phase2Summary,
    impact: ImpactAnalysis,
    prdText: string | null,
  ): void {
    const session = this.sessions.get(runId);
    if (!session) return;
    session.phase1Summary = phase1Summary;
    session.phase2Summary = phase2Summary;
    session.impact = impact;
    session.prdText = prdText;
  }

  setSubtasks(runId: string, subtasks: PlanStep[]): void {
    const session = this.sessions.get(runId);
    if (!session) return;
    session.subtasks = subtasks;
  }

  setRoadmapAndPrompts(runId: string, roadmap: Roadmap, promptPack: AgentPromptPack): void {
    const session = this.sessions.get(runId);
    if (!session) return;
    session.roadmap = roadmap;
    session.promptPack = promptPack;
  }

  markOutputWritten(runId: string): void {
    const session = this.sessions.get(runId);
    if (!session) return;
    session.outputWritten = true;
  }

  listSessions(): RunSession[] {
    return Array.from(this.sessions.values());
  }
}

export const sessionManager = new SessionManager();
