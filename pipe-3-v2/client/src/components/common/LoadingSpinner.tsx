export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* Data stream bars micro */}
      <div className="flex items-end gap-px h-4">
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
      {text && (
        <span className="text-sm font-mono" style={{ color: "#94a3b8" }}>
          {text}
        </span>
      )}
    </div>
  );
}
