import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ImpactFile } from "../../types";

const ROLE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  primary: { bg: "#ff446622", border: "#ff446644", color: "#ff4466" },
  secondary: { bg: "#f59e0b22", border: "#f59e0b44", color: "#f59e0b" },
  dependency: { bg: "#3b82f622", border: "#3b82f644", color: "#3b82f6" },
  dependent: { bg: "#64748b22", border: "#64748b44", color: "#94a3b8" },
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
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid #1a3055" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-xs uppercase tracking-wider"
            style={{ background: "#0f1f3a", color: "#94a3b8" }}
          >
            <th
              className="text-left px-3 py-2 cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid #1a3055" }}
              onClick={() => toggleSort("path")}
            >
              <span className="flex items-center gap-1 font-mono">
                File <SortIcon field="path" />
              </span>
            </th>
            <th
              className="text-center px-3 py-2 w-20 cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid #1a3055" }}
              onClick={() => toggleSort("score")}
            >
              <span className="flex items-center justify-center gap-1 font-mono">
                Score <SortIcon field="score" />
              </span>
            </th>
            <th
              className="text-center px-3 py-2 w-24 cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid #1a3055" }}
              onClick={() => toggleSort("role")}
            >
              <span className="flex items-center justify-center gap-1 font-mono">
                Role <SortIcon field="role" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => {
            const roleStyle = ROLE_STYLES[file.role] || ROLE_STYLES.dependent;
            return (
              <tr
                key={file.path}
                className="transition-colors"
                style={{ borderTop: "1px solid #1a3055" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0f1f3a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td className="px-3 py-2">
                  <button
                    onClick={() =>
                      setExpandedPath(expandedPath === file.path ? null : file.path)
                    }
                    className="text-left transition-colors"
                    style={{ color: "#00d4ff" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textShadow = "0 0 6px #00d4ff66";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textShadow = "none";
                    }}
                  >
                    <span className="font-mono text-xs">{file.path}</span>
                  </button>
                  {expandedPath === file.path && (
                    <div
                      className="mt-2 pl-2 space-y-1"
                      style={{ borderLeft: "2px solid #1a3055" }}
                    >
                      {file.reasons.map((r, i) => (
                        <p
                          key={i}
                          className="text-xs"
                          style={{ color: "#94a3b8" }}
                        >
                          {r}
                        </p>
                      ))}
                      {file.evidence.matchedTerms &&
                        file.evidence.matchedTerms.length > 0 && (
                          <p
                            className="text-xs font-mono"
                            style={{ color: "#64748b" }}
                          >
                            Terms: {file.evidence.matchedTerms.join(", ")}
                          </p>
                        )}
                      {file.evidence.matchedSymbols &&
                        file.evidence.matchedSymbols.length > 0 && (
                          <p
                            className="text-xs font-mono"
                            style={{ color: "#64748b" }}
                          >
                            Symbols: {file.evidence.matchedSymbols.join(", ")}
                          </p>
                        )}
                    </div>
                  )}
                </td>
                <td className="text-center px-3 py-2">
                  <span
                    className="font-mono text-xs"
                    style={{ color: "#cbd5e1" }}
                  >
                    {file.score.toFixed(2)}
                  </span>
                </td>
                <td className="text-center px-3 py-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium font-mono"
                    style={{
                      background: roleStyle.bg,
                      border: `1px solid ${roleStyle.border}`,
                      color: roleStyle.color,
                    }}
                  >
                    {file.role}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
