import { useEffect, useState } from "react";
import { Database, Check } from "lucide-react";
import { fetchPhase1Runs } from "../../api/phase1.api";
import type { Phase1RunInfo } from "../../types";
import LoadingSpinner from "../common/LoadingSpinner";

interface Phase1SelectorProps {
  selected: string | null;
  onSelect: (runId: string) => void;
}

export default function Phase1Selector({
  selected,
  onSelect,
}: Phase1SelectorProps) {
  const [runs, setRuns] = useState<Phase1RunInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhase1Runs()
      .then((r) => {
        setRuns(r);
        if (r.length === 1 && !selected) {
          onSelect(r[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading codebases..." />;
  if (error)
    return (
      <p className="text-sm font-mono" style={{ color: "#ff4466" }}>
        Failed to load: {error}
      </p>
    );
  if (runs.length === 0) {
    return (
      <p className="text-sm font-mono" style={{ color: "#94a3b8" }}>
        No pipe-1 runs found. Run pipe-1 first to analyze a codebase.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const isSelected = selected === run.id;
        return (
          <button
            key={run.id}
            onClick={() => onSelect(run.id)}
            className="w-full text-left rounded-xl transition-all duration-200"
            style={
              isSelected
                ? {
                    background: "linear-gradient(135deg, #00d4ff14, #8b5cf614)",
                    border: "1px solid #00d4ff66",
                    padding: "12px 16px",
                    boxShadow: "0 0 16px #00d4ff11",
                  }
                : {
                    background: "#0f1f3a",
                    border: "1px solid #1a3055",
                    padding: "12px 16px",
                  }
            }
          >
            <div className="flex items-center gap-3">
              <Database
                className="w-5 h-5 flex-shrink-0"
                style={{
                  color: isSelected ? "#00d4ff" : "#64748b",
                  filter: isSelected ? "drop-shadow(0 0 4px #00d4ff)" : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="font-mono text-sm font-medium truncate"
                  style={{ color: isSelected ? "#e2e8f0" : "#94a3b8" }}
                >
                  {run.projectId}
                </p>
                {run.scannedAt && (
                  <p
                    className="text-xs font-mono mt-0.5"
                    style={{ color: isSelected ? "#94a3b8" : "#64748b" }}
                  >
                    Scanned: {new Date(run.scannedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {isSelected && (
                <Check
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    color: "#00d4ff",
                    filter: "drop-shadow(0 0 4px #00d4ff)",
                  }}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
