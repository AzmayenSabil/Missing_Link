import { FileCode, Files, Layers } from "lucide-react";
import type { ImpactAnalysis } from "../../types";

export default function ImpactSummaryCard({ impact }: { impact: ImpactAnalysis }) {
  const { primaryCount, secondaryCount } = impact.summary;
  const totalFiles = impact.files.length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div
        className="rounded-lg p-3 text-center"
        style={{
          background: "linear-gradient(135deg, #1a0a10, #2a0d1a)",
          border: "1px solid #ff446644",
        }}
      >
        <FileCode
          className="w-5 h-5 mx-auto mb-1"
          style={{ color: "#ff4466", filter: "drop-shadow(0 0 4px #ff446688)" }}
        />
        <p className="text-2xl font-bold font-mono" style={{ color: "#ff4466" }}>
          {primaryCount}
        </p>
        <p className="text-xs font-mono" style={{ color: "#94a3b8" }}>
          Primary
        </p>
      </div>
      <div
        className="rounded-lg p-3 text-center"
        style={{
          background: "linear-gradient(135deg, #1a1408, #2a1f0d)",
          border: "1px solid #f59e0b44",
        }}
      >
        <Files
          className="w-5 h-5 mx-auto mb-1"
          style={{ color: "#f59e0b", filter: "drop-shadow(0 0 4px #f59e0b88)" }}
        />
        <p className="text-2xl font-bold font-mono" style={{ color: "#f59e0b" }}>
          {secondaryCount}
        </p>
        <p className="text-xs font-mono" style={{ color: "#94a3b8" }}>
          Secondary
        </p>
      </div>
      <div
        className="rounded-lg p-3 text-center"
        style={{
          background: "linear-gradient(135deg, #0a1525, #0d1f3a)",
          border: "1px solid #00d4ff44",
        }}
      >
        <Layers
          className="w-5 h-5 mx-auto mb-1"
          style={{ color: "#00d4ff", filter: "drop-shadow(0 0 4px #00d4ff88)" }}
        />
        <p className="text-2xl font-bold font-mono" style={{ color: "#00d4ff" }}>
          {totalFiles}
        </p>
        <p className="text-xs font-mono" style={{ color: "#94a3b8" }}>
          Total
        </p>
      </div>
    </div>
  );
}
