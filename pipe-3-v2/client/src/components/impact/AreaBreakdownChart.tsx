import type { AreaSummary } from "../../types";

const AREA_COLORS: Record<string, string> = {
  "UI": "bg-violet-500",
  "Hooks": "bg-cyan-500",
  "State": "bg-orange-500",
  "API/Service": "bg-blue-500",
  "Auth": "bg-red-500",
  "Routing": "bg-emerald-500",
  "Styling": "bg-pink-500",
  "Types": "bg-indigo-500",
  "Tests": "bg-yellow-500",
  "Build/Config": "bg-slate-500",
  "Unknown": "bg-gray-400",
};

export default function AreaBreakdownChart({ areas }: { areas: AreaSummary[] }) {
  if (areas.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Impact by Area
      </h4>
      {areas.map((area) => (
        <div key={area.area} className="flex items-center gap-3">
          <span className="text-xs text-slate-600 w-24 text-right">{area.area}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${AREA_COLORS[area.area] || "bg-gray-400"}`}
              style={{ width: `${Math.round(area.confidence * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 w-10">
            {Math.round(area.confidence * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
