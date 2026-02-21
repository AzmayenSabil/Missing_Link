import type { ImpactAnalysis } from "../../types";
import ImpactSummaryCard from "./ImpactSummaryCard";
import AreaBreakdownChart from "./AreaBreakdownChart";
import FileImpactTable from "./FileImpactTable";

export default function ImpactDashboard({
  impact,
}: {
  impact: ImpactAnalysis;
}) {
  const newFiles = impact.notes
    .filter((n) => n.startsWith("Suggested new file:"))
    .map((n) => n.replace("Suggested new file: ", "").split(" – "));

  return (
    <div className="space-y-5 max-w-full">
      <h3 className="text-lg font-bold font-mono gradient-text-cyber">
        Impact Analysis
      </h3>

      <ImpactSummaryCard impact={impact} />

      <AreaBreakdownChart areas={impact.summary.areas} />

      {newFiles.length > 0 && (
        <div>
          <h4
            className="text-xs font-mono tracking-widest uppercase mb-2"
            style={{ color: "#00ffa355" }}
          >
            + New Files to Create
          </h4>
          <div className="space-y-1">
            {newFiles.map(([filePath, reason], idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0"
                  style={{
                    color: "#00ffa3",
                    background: "#00ffa30a",
                    border: "1px solid #00ffa322",
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
          className="text-xs font-mono tracking-widest uppercase mb-2"
          style={{ color: "#00d4ff44" }}
        >
          Impacted Files ({impact.files.length})
        </h4>
        <FileImpactTable files={impact.files} />
      </div>

      {impact.notes.length > 0 && (
        <div>
          <h4
            className="text-xs font-mono tracking-widest uppercase mb-2"
            style={{ color: "#64748b" }}
          >
            // Analysis Notes
          </h4>
          <ul className="space-y-1">
            {impact.notes
              .filter((n) => !n.startsWith("Suggested new file:"))
              .map((note, idx) => (
                <li
                  key={idx}
                  className="text-xs flex items-start gap-1.5"
                  style={{ color: "#64748b" }}
                >
                  <span style={{ color: "#64748b" }}>›</span>
                  {note}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
