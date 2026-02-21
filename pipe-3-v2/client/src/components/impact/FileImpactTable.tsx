import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ImpactFile } from "../../types";

const ROLE_STYLES: Record<string, [string, string, string]> = {
  primary: ["rgba(255,68,102,0.1)", "#ff446644", "#ff7799"],
  secondary: ["rgba(245,158,11,0.08)", "#f59e0b33", "#fbbf24"],
  dependency: ["rgba(0,212,255,0.07)", "#00d4ff33", "#67e8f9"],
  dependent: ["rgba(100,116,139,0.1)", "#64748b33", "#94a3b8"],
};

type SortField = "score" | "role" | "path";

export default function FileImpactTable({ files }: { files: ImpactFile[] }) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
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
    return sortAsc ? (
      <ChevronUp className="w-3 h-3" style={{ color: "#00d4ff" }} />
    ) : (
      <ChevronDown className="w-3 h-3" style={{ color: "#00d4ff" }} />
    );
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid #1a3055" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              background: "rgba(13,30,53,0.8)",
              borderBottom: "1px solid #1a3055",
            }}
          >
            {[
              {
                field: "path" as SortField,
                label: "File",
                align: "text-left",
                extra: "",
              },
              {
                field: "score" as SortField,
                label: "Score",
                align: "text-center",
                extra: "w-20",
              },
              {
                field: "role" as SortField,
                label: "Role",
                align: "text-center",
                extra: "w-28",
              },
            ].map(({ field, label, align, extra }) => (
              <th
                key={field}
                className={`${align} ${extra} px-3 py-2 cursor-pointer text-xs font-mono tracking-widest uppercase transition-colors`}
                style={{ color: "#64748b" }}
                onClick={() => toggleSort(field)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00d4ff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                <span
                  className={`flex items-center gap-1 ${align === "text-center" ? "justify-center" : ""}`}
                >
                  {label} <SortIcon field={field} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => (
            <tr
              key={file.path}
              className="cyber-row transition-colors"
              style={{ borderBottom: "1px solid #0d1e35" }}
            >
              <td className="px-3 py-2">
                <button
                  onClick={() =>
                    setExpandedPath(
                      expandedPath === file.path ? null : file.path,
                    )
                  }
                  className="text-left transition-colors"
                  style={{ color: "#cbd5e1" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#00d4ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#cbd5e1")
                  }
                >
                  <span className="font-mono text-xs">{file.path}</span>
                </button>
                {expandedPath === file.path && (
                  <div
                    className="mt-2 pl-2 space-y-1"
                    style={{ borderLeft: "2px solid #00d4ff22" }}
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
                    {file.evidence?.matchedTerms &&
                      file.evidence.matchedTerms.length > 0 && (
                        <p
                          className="text-xs font-mono"
                          style={{ color: "#64748b" }}
                        >
                          terms: {file.evidence.matchedTerms.join(", ")}
                        </p>
                      )}
                    {file.evidence?.matchedSymbols &&
                      file.evidence.matchedSymbols.length > 0 && (
                        <p
                          className="text-xs font-mono"
                          style={{ color: "#64748b" }}
                        >
                          symbols: {file.evidence.matchedSymbols.join(", ")}
                        </p>
                      )}
                  </div>
                )}
              </td>
              <td className="text-center px-3 py-2">
                <span
                  className="font-mono text-xs"
                  style={{ color: "#00d4ffcc" }}
                >
                  {file.score.toFixed(2)}
                </span>
              </td>
              <td className="text-center px-3 py-2">
                {(() => {
                  const [bg, border, color] =
                    ROLE_STYLES[file.role] ?? ROLE_STYLES["dependent"];
                  return (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        color,
                      }}
                    >
                      {file.role}
                    </span>
                  );
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
