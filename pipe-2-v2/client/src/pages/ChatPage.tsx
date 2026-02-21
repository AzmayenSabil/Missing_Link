import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import QuestionCard from "../components/chat/QuestionCard";
import TypingIndicator from "../components/chat/TypingIndicator";
import ProgressBar from "../components/common/ProgressBar";
import ErrorBanner from "../components/common/ErrorBanner";
import { useSessionStore } from "../store/useSessionStore";
import { fetchRunStatus, fetchQuestions, submitAnswer } from "../api/runs.api";
import type { Question, RunStatus, ChatMessage } from "../types";

type ProgressStep = {
  label: string;
  status: "pending" | "active" | "complete";
};

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

/** Full-screen futuristic analysis overlay shown while AI is processing */
function AnalysisOverlay({ phase }: { phase: "questions" | "impact" }) {
  const isQuestions = phase === "questions";

  const title = isQuestions ? "Neural Analysis" : "Impact Mapping";
  const subtitle = isQuestions
    ? "Parsing PRD against codebase topology..."
    : "Building dependency graph & impact matrix...";
  const statusLines = isQuestions
    ? [
        "Tokenizing requirements",
        "Cross-referencing modules",
        "Identifying ambiguities",
        "Generating query set",
      ]
    : [
        "Serialising Q&A context",
        "Running impact model",
        "Scoring file vectors",
        "Writing output artefacts",
      ];

  return (
    <div
      className="rounded-2xl overflow-hidden relative slide-up"
      style={{
        background: "linear-gradient(135deg, #060d1f, #0d1830)",
        border: "1px solid #00d4ff33",
        boxShadow:
          "0 0 40px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)",
      }}
    >
      {/* Scan beam */}
      <div className="scan-beam" />

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-8 h-8"
        style={{
          background: "linear-gradient(135deg, #00d4ff44 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-8 h-8"
        style={{
          background: "linear-gradient(315deg, #8b5cf644 0%, transparent 50%)",
        }}
      />

      <div className="px-6 py-6">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-5">
          {/* Triple-ring mini loader */}
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent ring-cw"
              style={{
                borderTopColor: "#00d4ff",
                borderRightColor: "#00d4ff22",
                filter: "drop-shadow(0 0 4px #00d4ff)",
              }}
            />
            <div
              className="absolute inset-1.5 rounded-full border-2 border-transparent ring-ccw"
              style={{
                borderTopColor: "#8b5cf6",
                borderLeftColor: "#8b5cf622",
                filter: "drop-shadow(0 0 3px #8b5cf6)",
              }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: "#00d4ff",
                boxShadow: "0 0 6px #00d4ff",
              }}
            />
          </div>

          <div>
            <p
              className="font-bold font-mono tracking-wider text-sm"
              style={{ color: "#00d4ff", textShadow: "0 0 8px #00d4ff66" }}
            >
              {title.toUpperCase()}
            </p>
            <p
              className="text-xs font-mono mt-0.5"
              style={{ color: "#00d4ff66" }}
            >
              {subtitle}
            </p>
          </div>

          {/* Activity badge */}
          <div
            className="ml-auto px-2 py-0.5 rounded-full text-xs font-mono flex items-center gap-1"
            style={{
              background: "#00ffa322",
              border: "1px solid #00ffa344",
              color: "#00ffa3",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            ACTIVE
          </div>
        </div>

        {/* Waveform bars */}
        <div className="flex items-end gap-1 h-8 mb-5">
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                background: i % 3 === 0 ? "#8b5cf6" : "#00d4ff",
                transformOrigin: "bottom",
                animation: `barPulse ${0.8 + (i % 5) * 0.15}s ease-in-out infinite ${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Status lines */}
        <div className="space-y-2">
          {statusLines.map((line, i) => (
            <div key={line} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: "#00d4ff",
                  boxShadow: "0 0 4px #00d4ff",
                  animation: `barPulse 1.2s ease-in-out infinite ${i * 0.3}s`,
                }}
              />
              <span
                className="text-xs font-mono"
                style={{
                  color: i === 0 ? "#00d4ff" : "#00d4ff55",
                  animation:
                    i === 0 ? "neonFlicker 3s ease-in-out infinite" : undefined,
                }}
              >
                {line}
                {i === 0 && (
                  <span
                    className="animate-pulse ml-1"
                    style={{ color: "#00d4ff" }}
                  >
                    ...
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

  const addMsg = useCallback((role: ChatMessage["role"], content: string) => {
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `msg-${++msgIdCounter.current}`,
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, currentQuestion, isComplete]);

  useEffect(() => {
    addMsg("system", "PRD received. Analyzing against your codebase...");
  }, [addMsg]);

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

        if (res.status === "asking_questions" && !questionsLoadedRef.current) {
          questionsLoadedRef.current = true;
          const qRes = await fetchQuestions(runId);
          store.setQuestions(qRes.questions);
          addMsg(
            "ai",
            `I've analyzed your PRD and have ${qRes.questions.length} questions to clarify before we proceed. Let's go through them one by one.`,
          );
          setCurrentQuestion(qRes.questions[0] ?? null);
          stopPolling();
        }

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
    poll();

    return () => stopPolling();
  }, [runId]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleAnswer = async (value: string | string[]) => {
    if (!runId || !currentQuestion) return;
    setAnswering(true);

    addMsg("ai", currentQuestion.questionText);
    const displayValue = Array.isArray(value) ? value.join(", ") : value;
    addMsg("user", displayValue);

    try {
      const res = await submitAnswer(runId, currentQuestion.id, value);

      if (res.allAnswered) {
        setCurrentQuestion(null);
        addMsg("ai", "Great, all questions answered! Saving your responses...");
        setStatus("generating_impact");

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

            if (
              statusRes.status === "complete" &&
              !completeHandledRef.current
            ) {
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
        const questions = store.questions;
        const nextIdx =
          questions.findIndex((q) => q.id === currentQuestion.id) + 1;
        if (nextIdx < questions.length) {
          setCurrentQuestion(questions[nextIdx]);
        }
      }
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: { data?: { error?: { message?: string } } };
            message?: string;
          }
        )?.response?.data?.error?.message ?? (err as Error).message;
      setError(msg);
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-53px)]"
      style={{ background: "#060d1f" }}
    >
      {/* Progress bar */}
      <ProgressBar steps={getProgressSteps(status)} />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase mb-4 transition-all hover:opacity-80"
            style={{ color: "#00d4ff55" }}
          >
            <span>←</span> New Analysis
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

          {/* ── Futuristic waiting states ── */}
          {status === "generating_questions" && (
            <AnalysisOverlay phase="questions" />
          )}
          {status === "generating_impact" && <AnalysisOverlay phase="impact" />}

          {/* Typing indicator for answering state */}
          {answering && <TypingIndicator text="Processing your response..." />}

          {/* Error */}
          {error && (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          )}

          {/* ── Completion card ── */}
          {isComplete && (
            <div
              className="rounded-2xl overflow-hidden relative slide-up"
              style={{
                background:
                  "linear-gradient(135deg, #0a1f1a 0%, #0d2a1e 50%, #0a1f1a 100%)",
                border: "1px solid #00ffa344",
                boxShadow:
                  "0 0 40px rgba(0,255,163,0.1), inset 0 1px 0 rgba(0,255,163,0.1)",
              }}
            >
              {/* Corner accents */}
              <div
                className="absolute top-0 left-0 w-10 h-10"
                style={{
                  background:
                    "linear-gradient(135deg, #00ffa344 0%, transparent 50%)",
                }}
              />
              <div
                className="absolute bottom-0 right-0 w-10 h-10"
                style={{
                  background:
                    "linear-gradient(315deg, #00ffa322 0%, transparent 50%)",
                }}
              />

              <div className="text-center px-8 py-10">
                {/* Icon */}
                <div className="relative inline-flex mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "radial-gradient(circle, #00ffa322, transparent)",
                      border: "1px solid #00ffa344",
                      boxShadow: "0 0 30px #00ffa322",
                    }}
                  >
                    <CheckCircle2
                      className="w-10 h-10"
                      style={{
                        color: "#00ffa3",
                        filter: "drop-shadow(0 0 8px #00ffa3)",
                      }}
                    />
                  </div>
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-10"
                    style={{ border: "1px solid #00ffa3" }}
                  />
                </div>

                <h2
                  className="text-2xl font-bold font-mono tracking-wide mb-2"
                  style={{ color: "#00ffa3", textShadow: "0 0 12px #00ffa366" }}
                >
                  ANALYSIS COMPLETE
                </h2>
                <p
                  className="text-sm font-mono max-w-md mx-auto mb-6"
                  style={{ color: "#00ffa366" }}
                >
                  All clarifications captured. The development team will use
                  your answers to plan the implementation. Output artefacts
                  saved.
                </p>

                {/* Stats row */}
                <div className="flex justify-center gap-6 mb-8">
                  {[
                    { label: "STATUS", value: "✓ DONE" },
                    { label: "ARTIFACTS", value: "SAVED" },
                    { label: "PIPELINE", value: "→ PIPE-3" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p
                        className="text-xs font-mono mb-1"
                        style={{ color: "#00ffa355" }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="text-sm font-bold font-mono"
                        style={{ color: "#00ffa3" }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider uppercase transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #00ffa322, #00d4ff22)",
                    border: "1px solid #00ffa344",
                    color: "#00ffa3",
                    boxShadow: "0 0 16px #00ffa322",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  New Analysis
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
