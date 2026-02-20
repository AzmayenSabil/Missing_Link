import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSearch, ArrowRight, Loader2 } from "lucide-react";
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
      const msg = (err as { response?: { data?: { error?: { message?: string } } }; message?: string })
        ?.response?.data?.error?.message ?? (err as Error).message;
      setError(msg);
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <FolderSearch className="w-12 h-12 text-primary-500 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-slate-800">Implementation Planner</h1>
        <p className="text-slate-500 mt-2">
          Select a completed analysis run to generate implementation subtasks and code prompts.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Available Analysis Runs
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Scanning output directories...
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No completed pipe-2 runs found.</p>
            <p className="text-xs mt-1">
              Run pipe-2-v2 first to generate impact analysis data.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((pair, idx) => (
              <button
                key={`${pair.phase1RunId}-${pair.phase2RunId}`}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedIdx === idx
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {pair.projectId || pair.phase2RunId}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Phase-1: {pair.phase1RunId} | Phase-2: {pair.phase2RunId}
                    </p>
                  </div>
                  {selectedIdx === idx && (
                    <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={selectedIdx < 0 || starting}
          className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              Generate Implementation Plan
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
