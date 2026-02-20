import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import QuestionCard from "../components/chat/QuestionCard";
import TypingIndicator from "../components/chat/TypingIndicator";
import ProgressBar from "../components/common/ProgressBar";
import ErrorBanner from "../components/common/ErrorBanner";
import { useSessionStore } from "../store/useSessionStore";
import {
  fetchRunStatus,
  fetchQuestions,
  submitAnswer,
} from "../api/runs.api";
import type { Question, RunStatus, ChatMessage } from "../types";

type ProgressStep = { label: string; status: "pending" | "active" | "complete" };

function getProgressSteps(status: string): ProgressStep[] {
  const steps: ProgressStep[] = [
    { label: "PRD Uploaded", status: "pending" },
    { label: "Questions", status: "pending" },
    { label: "Answers", status: "pending" },
    { label: "Saving", status: "pending" },
    { label: "Done", status: "pending" },
  ];

  const statusMap: Record<string, number> = {
    created: 0,
    generating_questions: 1,
    asking_questions: 2,
    generating_impact: 3,
    complete: 4,
    error: -1,
  };

  const idx = statusMap[status] ?? -1;
  for (let i = 0; i < steps.length; i++) {
    if (i < idx) steps[i].status = "complete";
    else if (i === idx) steps[i].status = "active";
  }
  if (status === "complete") steps.forEach((s) => (s.status = "complete"));

  return steps;
}

export default function ChatPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const store = useSessionStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answering, setAnswering] = useState(false);
  const [status, setStatus] = useState<RunStatus | "idle">("created");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const questionsLoadedRef = useRef(false);
  const completeHandledRef = useRef(false);
  const msgIdCounter = useRef(0);

  const addMsg = useCallback(
    (role: ChatMessage["role"], content: string) => {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `msg-${++msgIdCounter.current}`,
          role,
          content,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, currentQuestion, isComplete]);

  // Initial system message
  useEffect(() => {
    addMsg("system", "PRD received. Analyzing against your codebase...");
  }, [addMsg]);

  // Poll for status changes
  useEffect(() => {
    if (!runId) return;

    const poll = async () => {
      try {
        const res = await fetchRunStatus(runId);
        setStatus(res.status);

        if (res.error) {
          setError(res.error);
          stopPolling();
          return;
        }

        // Questions are ready
        if (res.status === "asking_questions" && !questionsLoadedRef.current) {
          questionsLoadedRef.current = true;
          const qRes = await fetchQuestions(runId);
          store.setQuestions(qRes.questions);
          addMsg("ai", `I've analyzed your PRD and have ${qRes.questions.length} questions to clarify before we proceed. Let's go through them one by one.`);
          setCurrentQuestion(qRes.questions[0] ?? null);
          stopPolling();
        }

        // Run is complete (impact analysis done, output files written)
        if (res.status === "complete" && !completeHandledRef.current) {
          completeHandledRef.current = true;
          setIsComplete(true);
          stopPolling();
        }

        if (res.status === "complete" || res.status === "error") {
          stopPolling();
        }
      } catch {
        // Silently retry on poll errors
      }
    };

    pollingRef.current = setInterval(poll, 2000);
    poll(); // Immediate first call

    return () => stopPolling();
  }, [runId]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Handle question answer
  const handleAnswer = async (value: string | string[]) => {
    if (!runId || !currentQuestion) return;
    setAnswering(true);

    // Show the question text as an AI message, then user answer
    addMsg("ai", currentQuestion.questionText);
    const displayValue = Array.isArray(value) ? value.join(", ") : value;
    addMsg("user", displayValue);

    try {
      const res = await submitAnswer(runId, currentQuestion.id, value);

      if (res.allAnswered) {
        setCurrentQuestion(null);
        addMsg("ai", "Great, all questions answered! Saving your responses...");
        setStatus("generating_impact");

        // Start polling for completion
        completeHandledRef.current = false;
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await fetchRunStatus(runId);
            setStatus(statusRes.status);

            if (statusRes.error) {
              setError(statusRes.error);
              stopPolling();
              return;
            }

            if (statusRes.status === "complete" && !completeHandledRef.current) {
              completeHandledRef.current = true;
              setIsComplete(true);
              stopPolling();
            }
          } catch {
            // Silently retry
          }
        }, 2000);
      } else if (res.nextQuestion) {
        setCurrentQuestion(res.nextQuestion);
      } else {
        // Advance to next question from store
        const questions = store.questions;
        const nextIdx = questions.findIndex((q) => q.id === currentQuestion.id) + 1;
        if (nextIdx < questions.length) {
          setCurrentQuestion(questions[nextIdx]);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } }; message?: string })
        ?.response?.data?.error?.message ?? (err as Error).message;
      setError(msg);
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Progress bar */}
      <ProgressBar steps={getProgressSteps(status)} />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </button>

          {/* Messages */}
          {localMessages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </MessageBubble>
          ))}

          {/* Current question */}
          {currentQuestion && (
            <MessageBubble role="ai">
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={answering}
              />
            </MessageBubble>
          )}

          {/* Loading indicators */}
          {status === "generating_questions" && (
            <TypingIndicator text="Analyzing PRD and generating questions..." />
          )}
          {status === "generating_impact" && (
            <TypingIndicator text="Saving your responses and running analysis..." />
          )}

          {/* Error */}
          {error && (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          )}

          {/* Completion card */}
          {isComplete && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-8 shadow-sm text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">All Done!</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                Thanks for clarifying! The development team will use your answers
                to plan the implementation. Your responses have been saved.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Start New Analysis
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
