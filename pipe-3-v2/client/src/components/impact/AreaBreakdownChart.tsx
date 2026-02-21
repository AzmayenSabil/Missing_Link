import type { AreaSummary } from "../../types";

const AREA_NEON: Record<string, [string, string]> = {
  UI: ["#8b5cf6", "#8b5cf644"],
  Hooks: ["#00d4ff", "#00d4ff44"],
  State: ["#f59e0b", "#f59e0b44"],
  "API/Service": ["#3b82f6", "#3b82f644"],
  Auth: ["#ff4466", "#ff446644"],
  Routing: ["#00ffa3", "#00ffa344"],
  Styling: ["#ec4899", "#ec489944"],
  Types: ["#6366f1", "#6366f144"],
  Tests: ["#eab308", "#eab30844"],
  "Build/Config": ["#64748b", "#64748b44"],
  Unknown: ["#374151", "#37415144"],
};

export default function AreaBreakdownChart({
  areas,
}: {
  areas: AreaSummary[];
}) {
  if (areas.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4
        className="text-xs font-mono tracking-widest uppercase mb-3"
        style={{ color: "#00d4ff44" }}
      >
        Impact by Area
      </h4>
      {areas.map((area) => {
        const [color, trackColor] =
          AREA_NEON[area.area] ?? AREA_NEON["Unknown"];
        const pct = Math.round(area.confidence * 100);
        return (
          <div key={area.area} className="flex items-center gap-3">
            <span
              className="text-xs font-mono w-24 text-right"
              style={{ color: `${color}cc` }}
            >
              {area.area}
            </span>
            <div
              className="flex-1 rounded-full h-3 overflow-hidden"
              style={{
                background: "rgba(26,48,85,0.5)",
                border: "1px solid #1a305588",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 progress-neon"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${trackColor}, ${color})`,
                  boxShadow: `0 0 6px ${color}66`,
                }}
              />
            </div>
            <span
              className="text-xs font-mono w-10 text-right"
              style={{ color: `${color}88` }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
