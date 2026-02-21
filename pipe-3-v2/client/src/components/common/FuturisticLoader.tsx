import { useEffect, useState } from "react";

interface FuturisticLoaderProps {
  status: string;
}

const STATUS_MESSAGES: Record<string, string[]> = {
  created: [
    "Initializing pipeline...",
    "Allocating compute resources...",
    "Warming up analysis engine...",
  ],
  loading_inputs: [
    "Loading phase-1 codebase index...",
    "Ingesting phase-2 impact data...",
    "Parsing PRD requirements...",
    "Cross-referencing contract schemas...",
  ],
  generating_subtasks: [
    "Decomposing feature into atomic subtasks...",
    "Calculating dependency graph...",
    "Estimating implementation durations...",
    "Ordering subtasks by priority...",
    "Validating subtask coverage...",
  ],
  generating_prompts: [
    "Crafting code generation prompts...",
    "Injecting repo context...",
    "Embedding guardrails...",
    "Attaching impacted file lists...",
    "Finalizing deliverables...",
  ],
};

export default function FuturisticLoader({ status }: FuturisticLoaderProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState("");

  const messages = STATUS_MESSAGES[status] ?? ["Processing..."];

  useEffect(() => {
    setMsgIdx(0);
  }, [status]);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 1800);
    return () => clearInterval(id);
  }, [messages.length]);

  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      count = (count + 1) % 4;
      setDots(".".repeat(count));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 select-none">
      {/* Orbital rings */}
      <div className="relative w-28 h-28 mb-8">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, #00d4ff0a 0%, transparent 65%)",
            animation: "glowPulse 2s ease-in-out infinite",
          }}
        />

        {/* Outer ring */}
        <svg
          className="absolute inset-0 w-full h-full ring-cw"
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle cx="50" cy="50" r="46" stroke="#00d4ff22" strokeWidth="1" />
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="#00d4ff"
            strokeWidth="1.5"
            strokeDasharray="30 260"
            strokeLinecap="round"
          />
        </svg>

        {/* Mid ring */}
        <svg
          className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] ring-ccw"
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle cx="50" cy="50" r="46" stroke="#8b5cf633" strokeWidth="1" />
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeDasharray="20 270"
            strokeLinecap="round"
          />
        </svg>

        {/* Inner core */}
        <div
          className="absolute inset-8 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #00d4ff15, #8b5cf615)",
            border: "1px solid #00d4ff44",
            boxShadow: "0 0 16px #00d4ff33, inset 0 0 12px #00d4ff0a",
          }}
        >
          {/* Data stream bars */}
          <div className="flex items-end gap-0.5 h-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-1 rounded-sm bar-${i}`}
                style={{
                  height: "100%",
                  background: "linear-gradient(to top, #00d4ff, #8b5cf6)",
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
        </div>

        {/* Orbiting dot */}
        <div
          className="absolute inset-0"
          style={{ animation: "orbit 2s linear infinite" }}
        >
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#00d4ff",
              boxShadow: "0 0 6px #00d4ff, 0 0 12px #00d4ff88",
            }}
          />
        </div>

        {/* Orbiting dot 2 (opposite) */}
        <div
          className="absolute inset-2"
          style={{ animation: "orbit 1.4s linear infinite reverse" }}
        >
          <div
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#8b5cf6",
              boxShadow: "0 0 5px #8b5cf6, 0 0 10px #8b5cf688",
            }}
          />
        </div>
      </div>

      {/* Status message */}
      <div
        className="text-center px-6 py-3 rounded-lg"
        style={{
          background: "rgba(0,212,255,0.04)",
          border: "1px solid #00d4ff1a",
          minWidth: 280,
        }}
      >
        <p
          className="text-sm font-mono font-medium"
          style={{ color: "#00d4ff", textShadow: "0 0 10px #00d4ff55" }}
          key={msgIdx}
        >
          {messages[msgIdx]}
          {dots}
        </p>
      </div>

      {/* Scan beam strip */}
      <div
        className="mt-8 relative overflow-hidden rounded"
        style={{
          width: 200,
          height: 2,
          background: "#0d1830",
          border: "1px solid #1a3055",
        }}
      >
        <div className="scan-beam" style={{ height: "100%", top: 0 }} />
      </div>

      {/* Sub-label */}
      <p className="mt-4 text-xs font-mono" style={{ color: "#64748b" }}>
        PIPELINE · PHASE-3 · AI ANALYSIS
      </p>
    </div>
  );
}
