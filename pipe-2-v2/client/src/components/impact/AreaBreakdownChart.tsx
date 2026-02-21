import type { AreaSummary } from "../../types";

const AREA_COLORS: Record<string, string> = {
  "UI": "#8b5cf6",
  "Hooks": "#00d4ff",
  "State": "#f59e0b",
  "API/Service": "#3b82f6",
  "Auth": "#ff4466",
  "Routing": "#00ffa3",
  "Styling": "#ec4899",
  "Types": "#6366f1",
  "Tests": "#eab308",
  "Build/Config": "#64748b",
  "Unknown": "#475569",
};

export default function AreaBreakdownChart({ areas }: { areas: AreaSummary[] }) {
  if (areas.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4
        className="text-xs font-semibold font-mono uppercase tracking-wider"
        style={{ color: "#94a3b8" }}
      >
        Impact by Area
      </h4>
      {areas.map((area) => {
        const color = AREA_COLORS[area.area] || "#475569";
        return (
          <div key={area.area} className="flex items-center gap-3">
            <span
              className="text-xs font-mono w-24 text-right"
              style={{ color: "#94a3b8" }}
            >
              {area.area}
            </span>
            <div
              className="flex-1 rounded-full h-4 overflow-hidden"
              style={{ background: "#0f1f3a" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(area.confidence * 100)}%`,
                  background: color,
                  boxShadow: `0 0 8px ${color}66`,
                }}
              />
            </div>
            <span
              className="text-xs font-mono w-10"
              style={{ color: "#94a3b8" }}
            >
              {Math.round(area.confidence * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
