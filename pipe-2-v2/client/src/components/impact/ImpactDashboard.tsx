import type { ImpactAnalysis } from "../../types";
import ImpactSummaryCard from "./ImpactSummaryCard";
import AreaBreakdownChart from "./AreaBreakdownChart";
import FileImpactTable from "./FileImpactTable";

export default function ImpactDashboard({ impact }: { impact: ImpactAnalysis }) {
  // Extract new file suggestions from notes
  const newFiles = impact.notes
    .filter((n) => n.startsWith("Suggested new file:"))
    .map((n) => n.replace("Suggested new file: ", "").split(" – "));

  return (
    <div className="space-y-5 max-w-full">
      <h3
        className="text-lg font-semibold font-mono"
        style={{ color: "#e2e8f0" }}
      >
        Impact Analysis Results
      </h3>

      <ImpactSummaryCard impact={impact} />

      <AreaBreakdownChart areas={impact.summary.areas} />

      {newFiles.length > 0 && (
        <div>
          <h4
            className="text-xs font-semibold font-mono uppercase tracking-wider mb-2"
            style={{ color: "#94a3b8" }}
          >
            New Files to Create
          </h4>
          <div className="space-y-1">
            {newFiles.map(([filePath, reason], idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "#00ffa322",
                    border: "1px solid #00ffa344",
                    color: "#00ffa3",
                  }}
                >
                  + {filePath}
                </span>
                {reason && (
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4
          className="text-xs font-semibold font-mono uppercase tracking-wider mb-2"
          style={{ color: "#94a3b8" }}
        >
          Impacted Files ({impact.files.length})
        </h4>
        <FileImpactTable files={impact.files} />
      </div>

      {impact.notes.length > 0 && (
        <div>
          <h4
            className="text-xs font-semibold font-mono uppercase tracking-wider mb-2"
            style={{ color: "#94a3b8" }}
          >
            Analysis Notes
          </h4>
          <ul className="space-y-1">
            {impact.notes
              .filter((n) => !n.startsWith("Suggested new file:"))
              .map((note, idx) => (
                <li
                  key={idx}
                  className="text-xs"
                  style={{ color: "#94a3b8" }}
                >
                  {note}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
