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
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ListChecks className="w-4 h-4 text-primary-500" />
          <span className="font-medium">{subtasks.length} subtasks</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4 text-primary-500" />
          <span className="font-medium">
            ~{totalDurationHours.toFixed(1)} hours total
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Across {areas.length} area{areas.length !== 1 ? "s" : ""}:{" "}
          {areas.join(", ")}
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
