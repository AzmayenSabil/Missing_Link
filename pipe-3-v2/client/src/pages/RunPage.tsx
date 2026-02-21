import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ListChecks,
  Terminal,
  Loader2,
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

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: "impact", label: "Impact Analysis", icon: BarChart3 },
  { id: "subtasks", label: "Subtasks", icon: ListChecks },
  { id: "prompts", label: "Code Prompts", icon: Terminal },
];

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const store = useSessionStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<RunStatus | "idle">("created");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("impact");
  const [copyAllDone, setCopyAllDone] = useState(false);

  const impactLoadedRef = useRef(false);
  const subtasksLoadedRef = useRef(false);
  const promptsLoadedRef = useRef(false);
  const copilotLoadedRef = useRef(false);
  const [showCopilotModal, setShowCopilotModal] = useState(false);

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

        // Load impact data when available
        if (
          !impactLoadedRef.current &&
          ["generating_subtasks", "generating_prompts", "complete"].includes(
            res.status,
          )
        ) {
          impactLoadedRef.current = true;
          const impactRes = await fetchImpact(runId);
          if (impactRes.impact) {
            store.setImpact(impactRes.impact);
          }
        }

        // Load copilot instructions as soon as inputs are loaded
        if (
          !copilotLoadedRef.current &&
          ["generating_subtasks", "generating_prompts", "complete"].includes(
            res.status,
          )
        ) {
          copilotLoadedRef.current = true;
          const ciRes = await fetchCopilotInstructions(runId);
          if (ciRes.copilotInstructions !== undefined) {
            store.setCopilotInstructions(
              ciRes.copilotInstructions ?? "",
              ciRes.systemPrompts ?? {},
            );
          }
        }

        // Load subtasks when available
        if (
          !subtasksLoadedRef.current &&
          ["generating_prompts", "complete"].includes(res.status) &&
          res.subtaskCount > 0
        ) {
          subtasksLoadedRef.current = true;
          const subtaskRes = await fetchSubtasks(runId);
          store.setSubtasks(subtaskRes.subtasks, subtaskRes.totalDurationHours);
        }

        // Load prompts when complete
        if (
          !promptsLoadedRef.current &&
          res.status === "complete" &&
          res.promptCount > 0
        ) {
          promptsLoadedRef.current = true;
          const promptRes = await fetchPrompts(runId);
          store.setPrompts(promptRes.prompts);
          stopPolling();
        }

        if (res.status === "complete" || res.status === "error") {
          stopPolling();
        }
      } catch {
        // Silently retry
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
        if (p.instructions.length > 0) {
          parts.push(
            `## Instructions\n${p.instructions.map((inst, j) => `${j + 1}. ${inst}`).join("\n")}\n`,
          );
        }
        if (p.guardrails.length > 0) {
          parts.push(
            `## Guardrails\n${p.guardrails.map((g) => `- ${g}`).join("\n")}\n`,
          );
        }
        if (p.deliverables.length > 0) {
          parts.push(
            `## Deliverables\n${p.deliverables.map((d) => `- ${d}`).join("\n")}\n`,
          );
        }
        return parts.join("\n");
      })
      .join("\n---\n\n");

    await navigator.clipboard.writeText(allText);
    setCopyAllDone(true);
    setTimeout(() => setCopyAllDone(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Progress bar */}
      <ProgressBar steps={getProgressSteps(status)} />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-1">
          {TABS.map((tab) => {
            const enabled = isTabEnabled(tab.id);
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => enabled && setActiveTab(tab.id)}
                disabled={!enabled}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? "border-primary-500 text-primary-700"
                    : enabled
                      ? "border-transparent text-slate-500 hover:text-slate-700"
                      : "border-transparent text-slate-300 cursor-not-allowed"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "subtasks" && store.subtasks.length > 0 && (
                  <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
                    {store.subtasks.length}
                  </span>
                )}
              </button>
            );
          })}

          {/* Copilot instructions + Back */}
          <div className="ml-auto flex items-center gap-2">
            {store.copilotInstructions !== null && (
              <button
                onClick={() => setShowCopilotModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                View Instructions
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Error */}
          {error && (
            <div className="mb-6">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {/* Loading states */}
          {(status === "created" || status === "loading_inputs") && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Loading pipe-1 and pipe-2 data...
            </div>
          )}

          {status === "generating_subtasks" && !store.impact && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Generating implementation subtasks...
            </div>
          )}

          {/* Impact tab */}
          {activeTab === "impact" && store.impact && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <ImpactDashboard impact={store.impact} />

              {status === "generating_subtasks" && (
                <div className="mt-6 flex items-center justify-center py-4 text-slate-400 border-t border-slate-100">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating subtasks based on impact analysis...
                </div>
              )}

              {store.subtasks.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab("subtasks")}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    View Subtasks ({store.subtasks.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Subtasks tab */}
          {activeTab === "subtasks" && store.subtasks.length > 0 && (
            <div>
              <SubtaskTimeline
                subtasks={store.subtasks}
                totalDurationHours={store.totalDurationHours}
              />

              {status === "generating_prompts" && (
                <div className="mt-6 flex items-center justify-center py-4 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating code prompts for each subtask...
                </div>
              )}

              {store.prompts.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab("prompts")}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    View Code Prompts ({store.prompts.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prompts tab */}
          {activeTab === "prompts" && store.prompts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Code Generation Prompts
                </h3>
                <button
                  onClick={handleCopyAll}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    copyAllDone
                      ? "bg-green-100 text-green-700"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  }`}
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

      {/* Copilot Instructions Modal */}
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
