import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSearch, ArrowRight, Loader2, Cpu, Database } from "lucide-react";
import { fetchAvailableRuns } from "../api/inputs.api";
import { createRun } from "../api/runs.api";
import { useSessionStore } from "../store/useSessionStore";
import ErrorBanner from "../components/common/ErrorBanner";
import type { RunPair } from "../types";

export default function HomePage() {
  const navigate = useNavigate();
  const store = useSessionStore();
  const [runs, setRuns] = useState<RunPair[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAvailableRuns();
        setRuns(res.runs);
        if (res.runs.length > 0) setSelectedIdx(0);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStart = async () => {
    if (selectedIdx < 0) return;
    const pair = runs[selectedIdx];
    setStarting(true);
    setError(null);

    try {
      const res = await createRun({
        phase1RunId: pair.phase1RunId,
        phase2RunId: pair.phase2RunId,
      });

      store.startRun(res.runId, pair.phase1RunId, pair.phase2RunId);
      navigate(`/run/${res.runId}`);
    } catch (err) {
      const msg =
        (
          err as {
            response?: { data?: { error?: { message?: string } } };
            message?: string;
          }
        )?.response?.data?.error?.message ?? (err as Error).message;
      setError(msg);
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 slide-up">
        {/* Icon cluster */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, #00d4ff11 0%, transparent 70%)",
              border: "1px solid #00d4ff22",
              animation: "glowPulse 2.5s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
              border: "1px solid #00d4ff44",
              boxShadow: "0 0 20px #00d4ff33",
            }}
          >
            <FolderSearch
              className="w-7 h-7"
              style={{
                color: "#00d4ff",
                filter: "drop-shadow(0 0 6px #00d4ff)",
              }}
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 gradient-text-cyber">
          Implementation Planner
        </h1>
        <p className="text-sm font-mono" style={{ color: "#64748b" }}>
          // PHASE-3 · AI-driven subtask &amp; prompt generator
        </p>
        <p className="mt-3 text-sm" style={{ color: "#cbd5e1" }}>
          Select a completed analysis run to generate implementation subtasks
          and code prompts.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Card */}
      <div
        className="rounded-xl p-6 slide-up corner-bracket"
        style={{
          background: "rgba(10,22,40,0.85)",
          border: "1px solid #1a3055",
          boxShadow:
            "0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,212,255,0.06)",
          animationDelay: "0.1s",
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4" style={{ color: "#00d4ff66" }} />
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: "#00d4ff66" }}
          >
            Available Analysis Runs
          </span>
          {!loading && (
            <span
              className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
              style={{
                color: runs.length > 0 ? "#00ffa3" : "#f59e0b",
                background: runs.length > 0 ? "#00ffa311" : "#f59e0b11",
                border: `1px solid ${runs.length > 0 ? "#00ffa322" : "#f59e0b22"}`,
              }}
            >
              {runs.length} found
            </span>
          )}
        </div>

        {loading ? (
          <div
            className="flex items-center justify-center py-10 gap-3"
            style={{ color: "#94a3b8" }}
          >
            {/* Data stream bars */}
            <div className="flex items-end gap-0.5 h-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-1 rounded-sm bar-${i}`}
                  style={{
                    height: "100%",
                    background: "linear-gradient(to top, #00d4ff, #8b5cf6)",
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-mono">
              Scanning output directories...
            </span>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-10" style={{ color: "#94a3b8" }}>
            <Cpu
              className="w-8 h-8 mx-auto mb-3"
              style={{ color: "#3a5570" }}
            />
            <p className="text-sm font-mono">
              // No completed pipe-2 runs found
            </p>
            <p className="text-xs mt-2" style={{ color: "#64748b" }}>
              Run pipe-2-v2 first to generate impact analysis data.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((pair, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={`${pair.phase1RunId}-${pair.phase2RunId}`}
                  onClick={() => setSelectedIdx(idx)}
                  className="w-full text-left rounded-lg transition-all duration-200"
                  style={{
                    padding: "12px 16px",
                    background: isSelected
                      ? "rgba(0,212,255,0.07)"
                      : "rgba(10,22,40,0.5)",
                    border: isSelected
                      ? "1px solid #00d4ff55"
                      : "1px solid #1a3055",
                    boxShadow: isSelected
                      ? "0 0 12px #00d4ff1a, inset 0 1px 0 rgba(0,212,255,0.1)"
                      : "none",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm font-semibold font-mono"
                        style={{
                          color: isSelected ? "#00d4ff" : "#e2e8f0",
                          textShadow: isSelected
                            ? "0 0 10px #00d4ff55"
                            : "none",
                        }}
                      >
                        {pair.projectId || pair.phase2RunId}
                      </p>
                      <p
                        className="text-xs mt-0.5 font-mono"
                        style={{ color: "#94a3b8" }}
                      >
                        phase-1: {pair.phase1RunId} &nbsp;·&nbsp; phase-2:{" "}
                        {pair.phase2RunId}
                      </p>
                    </div>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-4"
                        style={{
                          background:
                            "linear-gradient(135deg, #00d4ff, #8b5cf6)",
                          boxShadow: "0 0 8px #00d4ff66",
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={selectedIdx < 0 || starting}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200"
          style={{
            padding: "12px 20px",
            background:
              selectedIdx < 0 || starting
                ? "rgba(26,48,85,0.4)"
                : "linear-gradient(135deg, #0099bb 0%, #6d28d9 100%)",
            border:
              selectedIdx < 0 || starting
                ? "1px solid #1a3055"
                : "1px solid #00d4ff55",
            color: selectedIdx < 0 || starting ? "#2a4060" : "#ffffff",
            boxShadow:
              selectedIdx < 0 || starting
                ? "none"
                : "0 0 20px #00d4ff33, 0 4px 16px rgba(0,0,0,0.4)",
            cursor: selectedIdx < 0 || starting ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono">INITIALIZING PIPELINE...</span>
            </>
          ) : (
            <>
              <span>Generate Implementation Plan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
