/**
 * Zustand store for the current session state.
 */

import { create } from "zustand";
import type { Question, ImpactAnalysis, ChatMessage, RunStatus } from "../types";

interface SessionState {
  // Session identity
  runId: string | null;
  phase1RunId: string | null;
  status: RunStatus | "idle" | "uploading_prd";
  error: string | null;

  // PRD
  prdText: string | null;
  prdFileName: string | null;

  // Questions
  questions: Question[];
  answers: Map<string, string | string[]>;
  currentQuestionIndex: number;

  // Impact
  impactAnalysis: ImpactAnalysis | null;

  // Chat messages
  messages: ChatMessage[];

  // Actions
  setPhase1Run: (runId: string) => void;
  setPrd: (text: string, fileName: string) => void;
  startRun: (runId: string) => void;
  setStatus: (status: RunStatus | "idle" | "uploading_prd") => void;
  setError: (error: string | null) => void;
  setQuestions: (questions: Question[]) => void;
  answerQuestion: (questionId: string, value: string | string[]) => void;
  advanceQuestion: () => void;
  setImpactAnalysis: (impact: ImpactAnalysis) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  reset: () => void;
}

let messageCounter = 0;

export const useSessionStore = create<SessionState>((set) => ({
  runId: null,
  phase1RunId: null,
  status: "idle",
  error: null,
  prdText: null,
  prdFileName: null,
  questions: [],
  answers: new Map(),
  currentQuestionIndex: 0,
  impactAnalysis: null,
  messages: [],

  setPhase1Run: (runId) => set({ phase1RunId: runId }),

  setPrd: (text, fileName) => set({ prdText: text, prdFileName: fileName }),

  startRun: (runId) => set({ runId, status: "created" }),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error, status: error ? "error" : undefined }),

  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0 }),

  answerQuestion: (questionId, value) =>
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, value);
      return { answers: newAnswers };
    }),

  advanceQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
    })),

  setImpactAnalysis: (impact) => set({ impactAnalysis: impact }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: `msg-${++messageCounter}`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  reset: () =>
    set({
      runId: null,
      phase1RunId: null,
      status: "idle",
      error: null,
      prdText: null,
      prdFileName: null,
      questions: [],
      answers: new Map(),
      currentQuestionIndex: 0,
      impactAnalysis: null,
      messages: [],
    }),
}));
