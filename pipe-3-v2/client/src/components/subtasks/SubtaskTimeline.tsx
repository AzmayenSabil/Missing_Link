import { Clock, ListChecks } from "lucide-react";
import type { PlanStep } from "../../types";
import SubtaskCard from "./SubtaskCard";

interface SubtaskTimelineProps {
  subtasks: PlanStep[];
  totalDurationHours: number;
}

export default function SubtaskTimeline({
  subtasks,
  totalDurationHours,
}: SubtaskTimelineProps) {
  const areas = [...new Set(subtasks.map((s) => s.area))];

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div
        className="flex items-center gap-6 px-4 py-3 rounded-lg"
        style={{
          background: "rgba(10,22,40,0.6)",
          border: "1px solid #1a3055",
        }}
      >
        <div className="flex items-center gap-2">
          <ListChecks
            className="w-4 h-4"
            style={{ color: "#00d4ff", filter: "drop-shadow(0 0 4px #00d4ff)" }}
          />
          <span
            className="text-sm font-mono font-medium"
            style={{ color: "#e2e8f0" }}
          >
            {subtasks.length} <span style={{ color: "#94a3b8" }}>subtasks</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock
            className="w-4 h-4"
            style={{ color: "#8b5cf6", filter: "drop-shadow(0 0 4px #8b5cf6)" }}
          />
          <span
            className="text-sm font-mono font-medium"
            style={{ color: "#e2e8f0" }}
          >
            ~{totalDurationHours.toFixed(1)}h{" "}
            <span style={{ color: "#94a3b8" }}>total</span>
          </span>
        </div>
        <div className="text-xs font-mono" style={{ color: "#64748b" }}>
          Across {areas.length} area{areas.length !== 1 ? "s" : ""}:{" "}
          <span style={{ color: "#94a3b8" }}>{areas.join(", ")}</span>
        </div>
      </div>

      {/* Subtask cards */}
      <div className="space-y-2">
        {subtasks.map((step, idx) => (
          <SubtaskCard key={step.id} step={step} index={idx} />
        ))}
      </div>
    </div>
  );
}
