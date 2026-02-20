import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, FolderOpen } from "lucide-react";
import type { PlanStep } from "../../types";

const AREA_COLORS: Record<string, string> = {
  "UI": "bg-violet-100 text-violet-700",
  "Hooks": "bg-cyan-100 text-cyan-700",
  "State": "bg-orange-100 text-orange-700",
  "API/Service": "bg-blue-100 text-blue-700",
  "Auth": "bg-red-100 text-red-700",
  "Routing": "bg-emerald-100 text-emerald-700",
  "Styling": "bg-pink-100 text-pink-700",
  "Types": "bg-indigo-100 text-indigo-700",
  "Tests": "bg-yellow-100 text-yellow-700",
  "Build/Config": "bg-slate-100 text-slate-600",
  "Unknown": "bg-gray-100 text-gray-600",
};

const KIND_LABELS: Record<string, string> = {
  create: "Create",
  modify: "Modify",
  refactor: "Refactor",
  config: "Config",
  test: "Test",
  docs: "Docs",
};

export default function SubtaskCard({
  step,
  index,
}: {
  step: PlanStep;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const totalFiles =
    step.files.modify.length + step.files.create.length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Step number */}
          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-800">
                {step.title}
              </h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  AREA_COLORS[step.area] || "bg-gray-100 text-gray-600"
                }`}
              >
                {step.area}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {KIND_LABELS[step.kind] || step.kind}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {step.description}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {step.durationHours}h
              </span>
              <span className="flex items-center gap-1">
                <FolderOpen className="w-3 h-3" />
                {totalFiles} file{totalFiles !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
          {/* Files */}
          {step.files.modify.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Files to Modify</p>
              {step.files.modify.map((f) => (
                <p key={f} className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded mb-0.5">
                  {f}
                </p>
              ))}
            </div>
          )}
          {step.files.create.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Files to Create</p>
              {step.files.create.map((f) => (
                <p key={f} className="text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded mb-0.5">
                  + {f}
                </p>
              ))}
            </div>
          )}

          {/* Implementation checklist */}
          {step.implementationChecklist.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Implementation Steps</p>
              <ol className="list-decimal list-inside space-y-0.5">
                {step.implementationChecklist.map((item, i) => (
                  <li key={i} className="text-xs text-slate-600">{item}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Done when */}
          {step.doneWhen.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Done When</p>
              <ul className="space-y-0.5">
                {step.doneWhen.map((item, i) => (
                  <li key={i} className="text-xs text-slate-500 flex items-start gap-1">
                    <span className="text-green-500">&#10003;</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {step.dependsOnStepIds.length > 0 && (
            <p className="text-xs text-slate-400">
              Depends on: {step.dependsOnStepIds.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
