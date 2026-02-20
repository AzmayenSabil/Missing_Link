import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ImpactFile } from "../../types";

const ROLE_COLORS: Record<string, string> = {
  primary: "bg-red-100 text-red-700",
  secondary: "bg-amber-100 text-amber-700",
  dependency: "bg-blue-100 text-blue-700",
  dependent: "bg-slate-100 text-slate-600",
};

type SortField = "score" | "role" | "path";

export default function FileImpactTable({ files }: { files: ImpactFile[] }) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sorted = [...files].sort((a, b) => {
    let cmp = 0;
    if (sortField === "score") cmp = b.score - a.score;
    else if (sortField === "path") cmp = a.path.localeCompare(b.path);
    else cmp = a.role.localeCompare(b.role);
    return sortAsc ? -cmp : cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <th
              className="text-left px-3 py-2 cursor-pointer hover:text-slate-700"
              onClick={() => toggleSort("path")}
            >
              <span className="flex items-center gap-1">File <SortIcon field="path" /></span>
            </th>
            <th
              className="text-center px-3 py-2 w-20 cursor-pointer hover:text-slate-700"
              onClick={() => toggleSort("score")}
            >
              <span className="flex items-center justify-center gap-1">Score <SortIcon field="score" /></span>
            </th>
            <th
              className="text-center px-3 py-2 w-24 cursor-pointer hover:text-slate-700"
              onClick={() => toggleSort("role")}
            >
              <span className="flex items-center justify-center gap-1">Role <SortIcon field="role" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => (
            <tr key={file.path} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2">
                <button
                  onClick={() => setExpandedPath(expandedPath === file.path ? null : file.path)}
                  className="text-left hover:text-primary-600 transition-colors"
                >
                  <span className="font-mono text-xs">{file.path}</span>
                </button>
                {expandedPath === file.path && (
                  <div className="mt-2 pl-2 border-l-2 border-slate-200 space-y-1">
                    {file.reasons.map((r, i) => (
                      <p key={i} className="text-xs text-slate-500">{r}</p>
                    ))}
                    {file.evidence.matchedTerms && file.evidence.matchedTerms.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Terms: {file.evidence.matchedTerms.join(", ")}
                      </p>
                    )}
                    {file.evidence.matchedSymbols && file.evidence.matchedSymbols.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Symbols: {file.evidence.matchedSymbols.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </td>
              <td className="text-center px-3 py-2">
                <span className="font-mono text-xs">{file.score.toFixed(2)}</span>
              </td>
              <td className="text-center px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[file.role]}`}>
                  {file.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
