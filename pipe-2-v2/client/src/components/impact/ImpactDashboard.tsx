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
      <h3 className="text-lg font-semibold text-slate-800">Impact Analysis Results</h3>

      <ImpactSummaryCard impact={impact} />

      <AreaBreakdownChart areas={impact.summary.areas} />

      {newFiles.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            New Files to Create
          </h4>
          <div className="space-y-1">
            {newFiles.map(([filePath, reason], idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 font-mono text-xs bg-green-50 px-2 py-0.5 rounded">
                  + {filePath}
                </span>
                {reason && <span className="text-slate-500 text-xs">{reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Impacted Files ({impact.files.length})
        </h4>
        <FileImpactTable files={impact.files} />
      </div>

      {impact.notes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Analysis Notes
          </h4>
          <ul className="space-y-1">
            {impact.notes
              .filter((n) => !n.startsWith("Suggested new file:"))
              .map((note, idx) => (
                <li key={idx} className="text-xs text-slate-500">
                  {note}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
