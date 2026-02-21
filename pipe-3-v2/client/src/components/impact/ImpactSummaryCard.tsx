import { FileCode, Files, Layers } from "lucide-react";
import type { ImpactAnalysis } from "../../types";

export default function ImpactSummaryCard({
  impact,
}: {
  impact: ImpactAnalysis;
}) {
  const { primaryCount, secondaryCount } = impact.summary;
  const totalFiles = impact.files.length;

  const cards = [
    {
      icon: FileCode,
      label: "Primary",
      value: primaryCount,
      color: "#ff4466",
      bg: "rgba(255,68,102,0.07)",
      border: "1px solid #ff446633",
      shadow: "0 0 10px #ff446611",
    },
    {
      icon: Files,
      label: "Secondary",
      value: secondaryCount,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.07)",
      border: "1px solid #f59e0b33",
      shadow: "0 0 10px #f59e0b11",
    },
    {
      icon: Layers,
      label: "Total",
      value: totalFiles,
      color: "#00d4ff",
      bg: "rgba(0,212,255,0.07)",
      border: "1px solid #00d4ff33",
      shadow: "0 0 10px #00d4ff11",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(({ icon: Icon, label, value, color, bg, border, shadow }) => (
        <div
          key={label}
          className="rounded-lg p-3 text-center transition-all duration-200"
          style={{ background: bg, border, boxShadow: shadow }}
        >
          <Icon
            className="w-5 h-5 mx-auto mb-1"
            style={{ color, filter: `drop-shadow(0 0 4px ${color}88)` }}
          />
          <p
            className="text-2xl font-bold font-mono"
            style={{ color, textShadow: `0 0 10px ${color}66` }}
          >
            {value}
          </p>
          <p
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: `${color}88` }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
