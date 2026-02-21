import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Header() {
  return (
    <header
      className="px-6 py-3 flex items-center gap-3"
      style={{
        background:
          "linear-gradient(90deg, #060d1f 0%, #0d1830 50%, #060d1f 100%)",
        borderBottom: "1px solid #1a3055",
        boxShadow: "0 1px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.04)",
      }}
    >
      <Link
        to="/"
        className="flex items-center gap-2 transition-all duration-200 hover:opacity-90 group"
      >
        {/* Logo icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center relative"
          style={{
            background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
            border: "1px solid #00d4ff44",
            boxShadow: "0 0 12px #00d4ff22",
          }}
        >
          <Zap
            className="w-4 h-4 transition-all group-hover:scale-110"
            style={{ color: "#00d4ff", filter: "drop-shadow(0 0 4px #00d4ff)" }}
          />
        </div>

        <span className="font-bold text-lg font-mono tracking-tight gradient-text-cyber">
          Missing Link
        </span>
      </Link>

      {/* Divider */}
      <div className="h-4 w-px mx-1" style={{ background: "#1a3055" }} />

      <span
        className="text-xs font-mono tracking-widest uppercase"
        style={{ color: "#00d4ff55" }}
      >
        PRD Validation Pipeline
      </span>

      {/* Status indicator */}
      <div className="ml-auto flex items-center gap-1.5">
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "#00ffa3", boxShadow: "0 0 6px #00ffa3" }}
        />
        <span className="text-xs font-mono" style={{ color: "#00ffa366" }}>
          ONLINE
        </span>
      </div>
    </header>
  );
}
