import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ListChecks,
  Terminal,
  Copy,
  Check,
  BookOpen,
} from "lucide-react";
import { useSessionStore } from "../store/useSessionStore";
import {
  fetchRunStatus,
  fetchImpact,
  fetchSubtasks,
  fetchPrompts,
  fetchCopilotInstructions,
} from "../api/runs.api";
import ImpactDashboard from "../components/impact/ImpactDashboard";
import SubtaskTimeline from "../components/subtasks/SubtaskTimeline";
import PromptViewer from "../components/prompts/PromptViewer";
import ProgressBar from "../components/common/ProgressBar";
import ErrorBanner from "../components/common/ErrorBanner";
import CopilotInstructionsModal from "../components/common/CopilotInstructionsModal";
import FuturisticLoader from "../components/common/FuturisticLoader";
import type { RunStatus } from "../types";

type ProgressStep = {
  label: string;
  status: "pending" | "active" | "complete";
};

function getProgressSteps(status: string): ProgressStep[] {
  const steps: ProgressStep[] = [
    { label: "Load Data", status: "pending" },
    { label: "Subtasks", status: "pending" },
    { label: "Prompts", status: "pending" },
    { label: "Done", status: "pending" },
  ];

  const statusMap: Record<string, number> = {
    created: 0,
    loading_inputs: 0,
    generating_subtasks: 1,
    generating_prompts: 2,
    complete: 3,
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

type TabId = "impact" | "subtasks" | "prompts";

const TABS: {
  id: TabId;
  label: string;
  icon: typeof BarChart3;
  color: string;
}[] = [
  { id: "impact", label: "Impact Analysis", icon: BarChart3, color: "#00d4ff" },
  { id: "subtasks", label: "Subtasks", icon: ListChecks, color: "#8b5cf6" },
  { id: "prompts", label: "Code Prompts", icon: Terminal, color: "#00ffa3" },
];

const isWaiting = (status: string) =>
  [
    "created",
    "loading_inputs",
    "generating_subtasks",
    "generating_prompts",
  ].includes(status);

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const store = useSessionStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<RunStatus | "idle">("created");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("impact");
  const [copyAllDone, setCopyAllDone] = useState(false);
  const [showCopilotModal, setShowCopilotModal] = useState(false);

  const impactLoadedRef = useRef(false);
  const subtasksLoadedRef = useRef(false);
  const promptsLoadedRef = useRef(false);
  const copilotLoadedRef = useRef(false);

  /* ── polling ── */
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

        if (
          !impactLoadedRef.current &&
          ["generating_subtasks", "generating_prompts", "complete"].includes(
            res.status,
          )
        ) {
          impactLoadedRef.current = true;
          const r = await fetchImpact(runId);
          if (r.impact) {
            store.setImpact(r.impact);
            setActiveTab("impact");
          }
        }

        if (
          !copilotLoadedRef.current &&
          ["generating_subtasks", "generating_prompts", "complete"].includes(
            res.status,
          )
        ) {
          copilotLoadedRef.current = true;
          const r = await fetchCopilotInstructions(runId);
          if (r.copilotInstructions !== undefined)
            store.setCopilotInstructions(
              r.copilotInstructions ?? "",
              r.systemPrompts ?? {},
            );
        }

        if (
          !subtasksLoadedRef.current &&
          ["generating_prompts", "complete"].includes(res.status) &&
          res.subtaskCount > 0
        ) {
          subtasksLoadedRef.current = true;
          const r = await fetchSubtasks(runId);
          store.setSubtasks(r.subtasks, r.totalDurationHours);
        }

        if (
          !promptsLoadedRef.current &&
          res.status === "complete" &&
          res.promptCount > 0
        ) {
          promptsLoadedRef.current = true;
          const r = await fetchPrompts(runId);
          store.setPrompts(r.prompts);
          stopPolling();
        }

        if (res.status === "complete" || res.status === "error") stopPolling();
      } catch {
        /* silent retry */
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

  const isTabEnabled = (tab: TabId): boolean => {
    if (tab === "impact") return store.impact !== null;
    if (tab === "subtasks") return store.subtasks.length > 0;
    if (tab === "prompts") return store.prompts.length > 0;
    return false;
  };

  const handleCopyAll = async () => {
    const allText = store.prompts
      .map((p, i) => {
        const parts: string[] = [];
        parts.push(`# Step ${i + 1}: ${p.title}\n`);
        parts.push(`## System\n${p.system}\n`);
        if (p.instructions.length > 0)
          parts.push(
            `## Instructions\n${p.instructions.map((x, j) => `${j + 1}. ${x}`).join("\n")}\n`,
          );
        if (p.guardrails.length > 0)
          parts.push(
            `## Guardrails\n${p.guardrails.map((g) => `- ${g}`).join("\n")}\n`,
          );
        if (p.deliverables.length > 0)
          parts.push(
            `## Deliverables\n${p.deliverables.map((d) => `- ${d}`).join("\n")}\n`,
          );
        return parts.join("\n");
      })
      .join("\n---\n\n");

    await navigator.clipboard.writeText(allText);
    setCopyAllDone(true);
    setTimeout(() => setCopyAllDone(false), 2000);
  };

  /* ── Show futuristic loader when nothing is loaded yet ── */
  const showLoader =
    isWaiting(status) && store.impact === null && store.subtasks.length === 0;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 53px)" }}>
      {/* Progress bar */}
      <ProgressBar steps={getProgressSteps(status)} />

      {/* Tab bar */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a1628 0%, #060d1f 100%)",
          borderBottom: "1px solid #1a3055",
          boxShadow: "0 1px 0 #00d4ff08",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1">
          {TABS.map((tab) => {
            const enabled = isTabEnabled(tab.id);
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => enabled && setActiveTab(tab.id)}
                disabled={!enabled}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150 relative"
                style={{
                  color: active ? tab.color : enabled ? "#94a3b8" : "#3a5570",
                  textShadow: active ? `0 0 10px ${tab.color}66` : "none",
                  cursor: enabled ? "pointer" : "not-allowed",
                  borderBottom: active
                    ? `2px solid ${tab.color}`
                    : "2px solid transparent",
                  background: active ? `${tab.color}08` : "transparent",
                  marginBottom: "-1px",
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{
                    filter: active
                      ? `drop-shadow(0 0 4px ${tab.color})`
                      : "none",
                  }}
                />
                {tab.label}
                {tab.id === "subtasks" && store.subtasks.length > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                    style={{
                      background: "#8b5cf622",
                      color: "#8b5cf6",
                      border: "1px solid #8b5cf633",
                    }}
                  >
                    {store.subtasks.length}
                  </span>
                )}
                {tab.id === "prompts" && store.prompts.length > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                    style={{
                      background: "#00ffa322",
                      color: "#00ffa3",
                      border: "1px solid #00ffa333",
                    }}
                  >
                    {store.prompts.length}
                  </span>
                )}
              </button>
            );
          })}

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 py-2">
            {store.copilotInstructions !== null && (
              <button
                onClick={() => setShowCopilotModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  border: "1px solid #8b5cf633",
                  color: "#8b5cf6",
                  boxShadow: "0 0 8px #8b5cf622",
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Copilot Instructions
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-xs transition-colors px-2 py-1.5 rounded"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="mb-6 slide-up">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {/* Futuristic loader while waiting for first data */}
          {showLoader && <FuturisticLoader status={status} />}

          {/* Still generating subtasks but impact is loaded */}
          {status === "generating_subtasks" &&
            store.impact &&
            !store.subtasks.length && (
              <div
                className="flex items-center gap-3 justify-center py-4 mb-6 rounded-lg"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid #8b5cf622",
                }}
              >
                <div className="flex items-end gap-0.5 h-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-sm bar-${i}`}
                      style={{
                        height: "100%",
                        background: "linear-gradient(to top, #8b5cf6, #00d4ff)",
                        transformOrigin: "bottom",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-sm font-mono"
                  style={{ color: "#8b5cf6" }}
                >
                  Generating subtasks based on impact analysis...
                </span>
              </div>
            )}

          {/* Still generating prompts */}
          {status === "generating_prompts" &&
            store.subtasks.length > 0 &&
            !store.prompts.length && (
              <div
                className="flex items-center gap-3 justify-center py-4 mb-6 rounded-lg"
                style={{
                  background: "rgba(0,255,163,0.04)",
                  border: "1px solid #00ffa322",
                }}
              >
                <div className="flex items-end gap-0.5 h-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-sm bar-${i}`}
                      style={{
                        height: "100%",
                        background: "linear-gradient(to top, #00ffa3, #00d4ff)",
                        transformOrigin: "bottom",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-sm font-mono"
                  style={{ color: "#00ffa3" }}
                >
                  Generating code prompts for each subtask...
                </span>
              </div>
            )}

          {/* ── Impact tab ── */}
          {activeTab === "impact" && store.impact && (
            <div
              className="rounded-xl p-6 slide-up"
              style={{
                background: "rgba(10,22,40,0.85)",
                border: "1px solid #1a3055",
                boxShadow:
                  "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,212,255,0.06)",
              }}
            >
              <ImpactDashboard impact={store.impact} />
              {store.subtasks.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab("subtasks")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
                      border: "1px solid #8b5cf655",
                      color: "#8b5cf6",
                      boxShadow: "0 0 12px #8b5cf622",
                    }}
                  >
                    <ListChecks className="w-4 h-4" />
                    View Subtasks ({store.subtasks.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Subtasks tab ── */}
          {activeTab === "subtasks" && store.subtasks.length > 0 && (
            <div className="slide-up">
              <SubtaskTimeline
                subtasks={store.subtasks}
                totalDurationHours={store.totalDurationHours}
              />
              {store.prompts.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab("prompts")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, #00ffa322, #00d4ff22)",
                      border: "1px solid #00ffa355",
                      color: "#00ffa3",
                      boxShadow: "0 0 12px #00ffa322",
                    }}
                  >
                    <Terminal className="w-4 h-4" />
                    View Code Prompts ({store.prompts.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Prompts tab ── */}
          {activeTab === "prompts" && store.prompts.length > 0 && (
            <div className="slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold font-mono gradient-text-green">
                  Code Generation Prompts
                </h3>
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all"
                  style={
                    copyAllDone
                      ? {
                          background: "rgba(0,255,163,0.12)",
                          border: "1px solid #00ffa355",
                          color: "#00ffa3",
                          boxShadow: "0 0 10px #00ffa322",
                        }
                      : {
                          background: "rgba(0,212,255,0.08)",
                          border: "1px solid #00d4ff33",
                          color: "#00d4ff",
                          boxShadow: "0 0 8px #00d4ff1a",
                        }
                  }
                >
                  {copyAllDone ? (
                    <>
                      <Check className="w-4 h-4" />
                      All Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All Prompts
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2">
                {store.prompts.map((prompt, idx) => (
                  <PromptViewer
                    key={prompt.stepId}
                    prompt={prompt}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copilot Modal */}
      {showCopilotModal && store.copilotInstructions !== null && (
        <CopilotInstructionsModal
          copilotInstructions={store.copilotInstructions}
          systemPrompts={store.systemPrompts ?? {}}
          onClose={() => setShowCopilotModal(false)}
        />
      )}
    </div>
  );
}
