import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import Phase1Selector from "../components/phase1/Phase1Selector";
import PrdUploader from "../components/prd/PrdUploader";
import { useSessionStore } from "../store/useSessionStore";
import { createRun } from "../api/runs.api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorBanner from "../components/common/ErrorBanner";

export default function HomePage() {
  const navigate = useNavigate();
  const { phase1RunId, setPhase1Run, setPrd, startRun, prdText } =
    useSessionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prdFileName, setPrdFileName] = useState<string | null>(null);

  const handlePrdReady = (text: string, fileName: string) => {
    setPrd(text, fileName);
    setPrdFileName(fileName);
  };

  const handleStart = async () => {
    if (!phase1RunId || !prdText) return;
    setLoading(true);
    setError(null);

    try {
      const result = await createRun({
        phase1RunId,
        prdText,
        prdFileName: prdFileName || "uploaded.md",
      });
      startRun(result.runId);
      navigate(`/chat/${result.runId}`);
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
      setLoading(false);
    }
  };

  const canStart = !!phase1RunId && !!prdText && !loading;

  return (
    <div className="min-h-full cyber-bg" style={{ background: "#060d1f" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          {/* Glow icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
            style={{
              background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
              border: "1px solid #00d4ff44",
              boxShadow: "0 0 40px #00d4ff22",
            }}
          >
            <Zap
              className="w-8 h-8"
              style={{
                color: "#00d4ff",
                filter: "drop-shadow(0 0 8px #00d4ff)",
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl animate-ping opacity-10"
              style={{ border: "1px solid #00d4ff" }}
            />
          </div>

          <h1 className="text-4xl font-bold font-mono tracking-tight mb-3 gradient-text-cyber">
            PRD Validation
          </h1>
          <p
            className="text-sm font-mono max-w-md mx-auto"
            style={{ color: "#94a3b8", lineHeight: 1.7 }}
          >
            Analyze your PRD against an existing codebase to generate clarifying
            questions and a full impact analysis.
          </p>

          {/* Badge row */}
          <div className="flex justify-center gap-4 mt-5">
            {["PIPE-2", "v2.0", "LIVE"].map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{
                  background: "#0f1f3a",
                  border: "1px solid #1a3055",
                  color: "#64748b",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Step 1 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded"
              style={{
                background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
                border: "1px solid #00d4ff33",
                color: "#00d4ff",
              }}
            >
              01
            </span>
            <span
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: "#94a3b8" }}
            >
              Select Codebase
            </span>
            <div className="flex-1 h-px" style={{ background: "#1a3055" }} />
          </div>
          <Phase1Selector selected={phase1RunId} onSelect={setPhase1Run} />
        </div>

        {/* Step 2 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded"
              style={{
                background: "linear-gradient(135deg, #8b5cf622, #00d4ff22)",
                border: "1px solid #8b5cf633",
                color: "#8b5cf6",
              }}
            >
              02
            </span>
            <span
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: "#94a3b8" }}
            >
              Upload PRD
            </span>
            <div className="flex-1 h-px" style={{ background: "#1a3055" }} />
          </div>
          <PrdUploader onPrdReady={handlePrdReady} />
        </div>

        {/* Launch button */}
        <div className="flex justify-center">
          {loading ? (
            <div
              className="flex flex-col items-center gap-3 px-10 py-6 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #0f1f3a, #111d30)",
                border: "1px solid #00d4ff33",
                boxShadow: "0 0 30px rgba(0,212,255,0.08)",
              }}
            >
              <LoadingSpinner />
              <span
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: "#94a3b8" }}
              >
                Initializing Pipeline...
              </span>
            </div>
          ) : (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="relative overflow-hidden flex items-center gap-3 px-10 py-4 rounded-2xl font-mono font-bold text-sm tracking-widest uppercase transition-all duration-200 group"
              style={
                canStart
                  ? {
                      background:
                        "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
                      border: "1px solid #00d4ff66",
                      color: "#00d4ff",
                      boxShadow: "0 0 20px #00d4ff22",
                    }
                  : {
                      background: "#0f1f3a",
                      border: "1px solid #1a3055",
                      color: "#64748b",
                      cursor: "not-allowed",
                    }
              }
            >
              {canStart && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.08) 50%, transparent 100%)",
                  }}
                />
              )}
              <Zap
                className="w-4 h-4 transition-all group-hover:scale-110"
                style={
                  canStart ? { filter: "drop-shadow(0 0 4px #00d4ff)" } : {}
                }
              />
              Launch Analysis
              <span
                className="text-xs font-normal"
                style={{ color: canStart ? "#94a3b8" : "#64748b" }}
              >
                →
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
