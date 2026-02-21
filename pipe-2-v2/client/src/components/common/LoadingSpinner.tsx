export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Triple-ring loader */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent ring-cw"
          style={{
            borderTopColor: "#00d4ff",
            borderRightColor: "#00d4ff44",
            filter: "drop-shadow(0 0 6px #00d4ff)",
          }}
        />
        {/* Middle ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent ring-ccw"
          style={{
            borderTopColor: "#8b5cf6",
            borderLeftColor: "#8b5cf644",
            filter: "drop-shadow(0 0 4px #8b5cf6)",
          }}
        />
        {/* Inner dot */}
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: "#00d4ff",
            boxShadow: "0 0 8px #00d4ff, 0 0 16px #00d4ff66",
          }}
        />
      </div>
      {text && (
        <span
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: "#00d4ff99" }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
