import { Check, Zap } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "complete";
}

export default function ProgressBar({ steps }: { steps: Step[] }) {
  return (
    <div
      className="flex items-center gap-1 px-4 py-2.5"
      style={{
        background: "linear-gradient(90deg, #060d1f, #0d1830, #060d1f)",
        borderBottom: "1px solid #1a3055",
        boxShadow: "0 1px 0 rgba(0,212,255,0.06)",
      }}
    >
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-1.5">
            {/* Step circle */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-500 relative"
              style={
                step.status === "complete"
                  ? {
                      background:
                        "linear-gradient(135deg, #00ffa322, #00d4ff22)",
                      border: "1px solid #00ffa3",
                      color: "#00ffa3",
                      boxShadow: "0 0 8px #00ffa344",
                    }
                  : step.status === "active"
                    ? {
                        background:
                          "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
                        border: "1px solid #00d4ff",
                        color: "#00d4ff",
                        boxShadow: "0 0 12px #00d4ff66",
                        animation: "progressFill 1.5s ease-in-out infinite",
                      }
                    : {
                        background: "#0f1f3a",
                        border: "1px solid #1a3055",
                        color: "#64748b",
                      }
              }
            >
              {step.status === "complete" ? (
                <Check className="w-3 h-3" />
              ) : step.status === "active" ? (
                <Zap className="w-3 h-3" />
              ) : (
                idx + 1
              )}
              {/* Active pulse ring */}
              {step.status === "active" && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ border: "1px solid #00d4ff" }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-xs whitespace-nowrap font-mono transition-all duration-300"
              style={
                step.status === "active"
                  ? { color: "#00d4ff", textShadow: "0 0 6px #00d4ff66" }
                  : step.status === "complete"
                    ? { color: "#00ffa3" }
                    : { color: "#64748b" }
              }
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div className="relative mx-2 h-px w-8 overflow-hidden">
              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  background:
                    step.status === "complete"
                      ? "linear-gradient(90deg, #00ffa3, #00d4ff44)"
                      : "#1a3055",
                }}
              />
              {step.status === "active" && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #00d4ff, transparent)",
                    animation: "scanBeam 1.5s linear infinite",
                  }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
