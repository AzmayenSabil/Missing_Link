import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "complete";
}

export default function ProgressBar({ steps }: { steps: Step[] }) {
  return (
    <div
      className="flex items-center gap-1 px-4 py-2.5"
      style={{
        background: "linear-gradient(180deg, #0d1e35 0%, #060d1f 100%)",
        borderBottom: "1px solid #1a3055",
      }}
    >
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background:
                  step.status === "complete"
                    ? "linear-gradient(135deg, #00ffa3, #00d4ff)"
                    : step.status === "active"
                      ? "linear-gradient(135deg, #00d4ff22, #8b5cf622)"
                      : "rgba(26,48,85,0.5)",
                border:
                  step.status === "complete"
                    ? "1px solid #00ffa366"
                    : step.status === "active"
                      ? "1px solid #00d4ff66"
                      : "1px solid #1a3055",
                color:
                  step.status === "complete"
                    ? "#060d1f"
                    : step.status === "active"
                      ? "#00d4ff"
                      : "#64748b",
                boxShadow:
                  step.status === "complete"
                    ? "0 0 6px #00ffa366"
                    : step.status === "active"
                      ? "0 0 8px #00d4ff44"
                      : "none",
              }}
            >
              {step.status === "complete" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className="text-xs whitespace-nowrap font-mono"
              style={{
                color:
                  step.status === "active"
                    ? "#00d4ff"
                    : step.status === "complete"
                      ? "#00ffa3"
                      : "#64748b",
                textShadow:
                  step.status === "active"
                    ? "0 0 8px #00d4ff55"
                    : step.status === "complete"
                      ? "0 0 6px #00ffa344"
                      : "none",
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className="w-8 h-px mx-2 transition-colors duration-300"
              style={{
                background:
                  step.status === "complete"
                    ? "linear-gradient(90deg, #00ffa344, #00d4ff44)"
                    : "#1a3055",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
