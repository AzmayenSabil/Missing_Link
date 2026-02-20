import { useEffect, useState } from "react";
import { Database, Check } from "lucide-react";
import { fetchPhase1Runs } from "../../api/phase1.api";
import type { Phase1RunInfo } from "../../types";
import LoadingSpinner from "../common/LoadingSpinner";

interface Phase1SelectorProps {
  selected: string | null;
  onSelect: (runId: string) => void;
}

export default function Phase1Selector({ selected, onSelect }: Phase1SelectorProps) {
  const [runs, setRuns] = useState<Phase1RunInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhase1Runs()
      .then((r) => {
        setRuns(r);
        // Auto-select if only one run
        if (r.length === 1 && !selected) {
          onSelect(r[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading codebases..." />;
  if (error) return <p className="text-red-500 text-sm">Failed to load: {error}</p>;
  if (runs.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        No pipe-1 runs found. Run pipe-1 first to analyze a codebase.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => (
        <button
          key={run.id}
          onClick={() => onSelect(run.id)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selected === run.id
              ? "border-primary-500 bg-primary-50"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <Database className={`w-5 h-5 ${selected === run.id ? "text-primary-500" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{run.projectId}</p>
              {run.scannedAt && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Scanned: {new Date(run.scannedAt).toLocaleString()}
                </p>
              )}
            </div>
            {selected === run.id && <Check className="w-5 h-5 text-primary-500" />}
          </div>
        </button>
      ))}
    </div>
  );
}
