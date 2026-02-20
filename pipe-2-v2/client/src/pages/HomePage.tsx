import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Phase1Selector from "../components/phase1/Phase1Selector";
import PrdUploader from "../components/prd/PrdUploader";
import { useSessionStore } from "../store/useSessionStore";
import { createRun } from "../api/runs.api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorBanner from "../components/common/ErrorBanner";

export default function HomePage() {
  const navigate = useNavigate();
  const { phase1RunId, setPhase1Run, setPrd, startRun, prdText } = useSessionStore();
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
      const msg = (err as { response?: { data?: { error?: { message?: string } } }; message?: string })
        ?.response?.data?.error?.message ?? (err as Error).message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800">PRD Validation</h1>
        <p className="text-slate-500 mt-2">
          Analyze your PRD against an existing codebase to generate clarifying questions and impact analysis.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Step 1: Select Codebase */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Step 1 — Select Codebase
        </h2>
        <Phase1Selector selected={phase1RunId} onSelect={setPhase1Run} />
      </div>

      {/* Step 2: Upload PRD */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Step 2 — Upload PRD
        </h2>
        <PrdUploader onPrdReady={handlePrdReady} />
      </div>

      {/* Start Analysis */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!phase1RunId || !prdText || loading}
          className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-600/20"
        >
          {loading ? (
            <LoadingSpinner text="Starting analysis..." />
          ) : (
            <>
              Start Analysis
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
