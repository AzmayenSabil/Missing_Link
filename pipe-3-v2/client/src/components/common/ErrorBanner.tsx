import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message,
  onDismiss,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{
        background: "rgba(255,68,102,0.08)",
        border: "1px solid #ff446644",
        boxShadow: "0 0 12px #ff446622",
      }}
    >
      <AlertTriangle
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: "#ff4466", filter: "drop-shadow(0 0 4px #ff446688)" }}
      />
      <div className="flex-1">
        <p className="text-sm font-mono" style={{ color: "#ff8899" }}>
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-mono underline transition-colors"
            style={{ color: "#ff4466" }}
          >
            RETRY
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="transition-colors"
          style={{ color: "#ff446666" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4466")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#ff446666")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
