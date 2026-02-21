import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, FolderOpen } from "lucide-react";
import type { PlanStep } from "../../types";

// Cyber neon color pairs: [bgAlpha, border, text, shadow]
const AREA_STYLES: Record<string, [string, string, string, string]> = {
  UI: ["#8b5cf611", "#8b5cf633", "#a78bfa", "#8b5cf622"],
  Hooks: ["#00d4ff11", "#00d4ff33", "#67e8f9", "#00d4ff22"],
  State: ["#f59e0b11", "#f59e0b33", "#fbbf24", "#f59e0b22"],
  "API/Service": ["#3b82f611", "#3b82f633", "#60a5fa", "#3b82f622"],
  Auth: ["#ff446611", "#ff446633", "#ff7799", "#ff446622"],
  Routing: ["#00ffa311", "#00ffa333", "#34d399", "#00ffa322"],
  Styling: ["#ec489911", "#ec489933", "#f472b6", "#ec489922"],
  Types: ["#6366f111", "#6366f133", "#818cf8", "#6366f122"],
  Tests: ["#eab30811", "#eab30833", "#fcd34d", "#eab30822"],
  "Build/Config": ["#64748b11", "#64748b33", "#94a3b8", "#64748b22"],
  Unknown: ["#37415111", "#37415133", "#6b7280", "#37415122"],
};

const KIND_STYLES: Record<string, [string, string]> = {
  create: ["#00ffa322", "#00ffa3"],
  modify: ["#f59e0b22", "#fbbf24"],
  refactor: ["#8b5cf622", "#a78bfa"],
  config: ["#64748b22", "#94a3b8"],
  test: ["#eab30822", "#fcd34d"],
  docs: ["#3b82f622", "#60a5fa"],
};

export default function SubtaskCard({
  step,
  index,
}: {
  step: PlanStep;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalFiles = step.files.modify.length + step.files.create.length;
  const [areaBg, areaBorder, areaText, areaShadow] =
    AREA_STYLES[step.area] ?? AREA_STYLES["Unknown"];
  const [kindBg, kindText] = KIND_STYLES[step.kind] ?? ["#37415122", "#6b7280"];

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(10,22,40,0.8)",
        border: expanded ? "1px solid #00d4ff22" : "1px solid #1a3055",
        boxShadow: expanded ? "0 0 12px #00d4ff0a" : "none",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(0,212,255,0.03)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-start gap-3">
          {/* Step number */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 mt-0.5"
            style={{
              background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
              border: "1px solid #00d4ff33",
              color: "#00d4ff",
              boxShadow: "0 0 6px #00d4ff22",
            }}
          >
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className="text-sm font-semibold"
                style={{ color: "#e2e8f0" }}
              >
                {step.title}
              </h4>
              {/* Area tag */}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                style={{
                  background: areaBg,
                  border: `1px solid ${areaBorder}`,
                  color: areaText,
                  boxShadow: `0 0 4px ${areaShadow}`,
                }}
              >
                {step.area}
              </span>
              {/* Kind tag */}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: kindBg,
                  color: kindText,
                  border: `1px solid ${kindText}33`,
                }}
              >
                {step.kind}
              </span>
            </div>

            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: "#94a3b8" }}
            >
              {step.description}
            </p>

            <div
              className="flex items-center gap-4 mt-2"
              style={{ color: "#64748b" }}
            >
              <span className="flex items-center gap-1 text-xs font-mono">
                <Clock className="w-3 h-3" style={{ color: "#00d4ff44" }} />
                {step.durationHours}h
              </span>
              <span className="flex items-center gap-1 text-xs font-mono">
                <FolderOpen
                  className="w-3 h-3"
                  style={{ color: "#00d4ff44" }}
                />
                {totalFiles} file{totalFiles !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {expanded ? (
            <ChevronDown
              className="w-4 h-4 flex-shrink-0 mt-1"
              style={{ color: "#00d4ff66" }}
            />
          ) : (
            <ChevronRight
              className="w-4 h-4 flex-shrink-0 mt-1"
              style={{ color: "#64748b" }}
            />
          )}
        </div>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-2 space-y-3"
          style={{ borderTop: "1px solid #0d1e35" }}
        >
          {/* Files to Modify */}
          {step.files.modify.length > 0 && (
            <div>
              <p
                className="text-xs font-mono tracking-wider mb-1"
                style={{ color: "#f59e0b66" }}
              >
                ✎ FILES TO MODIFY
              </p>
              <div className="space-y-0.5">
                {step.files.modify.map((f) => (
                  <p
                    key={f}
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                      color: "#fbbf24",
                      background: "#f59e0b0a",
                      border: "1px solid #f59e0b22",
                    }}
                  >
                    {f}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Files to Create */}
          {step.files.create.length > 0 && (
            <div>
              <p
                className="text-xs font-mono tracking-wider mb-1"
                style={{ color: "#00ffa366" }}
              >
                + FILES TO CREATE
              </p>
              <div className="space-y-0.5">
                {step.files.create.map((f) => (
                  <p
                    key={f}
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                      color: "#00ffa3",
                      background: "#00ffa30a",
                      border: "1px solid #00ffa322",
                    }}
                  >
                    + {f}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Implementation checklist */}
          {step.implementationChecklist.length > 0 && (
            <div>
              <p
                className="text-xs font-mono tracking-wider mb-1"
                style={{ color: "#00d4ff55" }}
              >
                // IMPLEMENTATION STEPS
              </p>
              <ol className="space-y-1">
                {step.implementationChecklist.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-start gap-2"
                    style={{ color: "#cbd5e1" }}
                  >
                    <span
                      className="text-xs font-mono flex-shrink-0"
                      style={{ color: "#00d4ff44" }}
                    >
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Done when */}
          {step.doneWhen.length > 0 && (
            <div>
              <p
                className="text-xs font-mono tracking-wider mb-1"
                style={{ color: "#00ffa355" }}
              >
                ✓ DONE WHEN
              </p>
              <ul className="space-y-0.5">
                {step.doneWhen.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-start gap-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    <span style={{ color: "#00ffa344" }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {step.dependsOnStepIds.length > 0 && (
            <p className="text-xs font-mono" style={{ color: "#64748b" }}>
              depends_on: [{step.dependsOnStepIds.join(", ")}]
            </p>
          )}
        </div>
      )}
    </div>
  );
}
