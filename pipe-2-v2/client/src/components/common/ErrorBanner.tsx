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
      className="rounded-xl px-4 py-3 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, #1f0a14, #2a0d1a)",
        border: "1px solid #ff446644",
        boxShadow: "0 0 16px #ff446611",
      }}
    >
      <AlertTriangle
        className="w-5 h-5 mt-0.5 flex-shrink-0"
        style={{ color: "#ff4466", filter: "drop-shadow(0 0 4px #ff446688)" }}
      />
      <div className="flex-1">
        <p className="text-sm font-mono" style={{ color: "#fecdd3" }}>
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-mono tracking-wider uppercase underline transition-opacity hover:opacity-70"
            style={{ color: "#ff4466" }}
          >
            Retry →
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="transition-opacity hover:opacity-60"
          style={{ color: "#ff4466" }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
