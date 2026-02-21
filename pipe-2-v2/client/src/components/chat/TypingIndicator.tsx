export default function TypingIndicator({ text }: { text?: string }) {
  return (
    <div className="flex items-start gap-3 max-w-[85%] slide-up">
      {/* AI Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative"
        style={{
          background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
          border: "1px solid #00d4ff44",
          boxShadow: "0 0 12px #00d4ff22",
        }}
      >
        <span
          className="text-xs font-bold font-mono"
          style={{ color: "#00d4ff", textShadow: "0 0 6px #00d4ff" }}
        >
          AI
        </span>
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{
            background: "radial-gradient(circle, #00d4ff, transparent)",
          }}
        />
      </div>

      {/* Bubble */}
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 corner-bracket"
        style={{
          background: "linear-gradient(135deg, #0f1f3a, #111d30)",
          border: "1px solid #1a3055",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,212,255,0.06)",
        }}
      >
        {/* Scan beam inside bubble */}
        <div className="relative overflow-hidden rounded-lg px-2 py-1">
          <div className="scan-beam" style={{ opacity: 0.4 }} />

          {/* Animated bars */}
          <div className="flex items-end gap-1 h-5">
            <div
              className="bar-1 w-1 h-3 rounded-sm"
              style={{ background: "#00d4ff", transformOrigin: "bottom" }}
            />
            <div
              className="bar-2 w-1 h-4 rounded-sm"
              style={{ background: "#8b5cf6", transformOrigin: "bottom" }}
            />
            <div
              className="bar-3 w-1 h-3 rounded-sm"
              style={{ background: "#00d4ff", transformOrigin: "bottom" }}
            />
            <div
              className="bar-4 w-1 h-4 rounded-sm"
              style={{ background: "#8b5cf6", transformOrigin: "bottom" }}
            />
            <div
              className="bar-5 w-1 h-3 rounded-sm"
              style={{ background: "#00ffa3", transformOrigin: "bottom" }}
            />
          </div>
        </div>

        {text && (
          <p
            className="text-xs font-mono tracking-wide mt-2"
            style={{ color: "#00d4ff88" }}
          >
            <span className="animate-pulse">▸</span> {text}
          </p>
        )}
      </div>
    </div>
  );
}
