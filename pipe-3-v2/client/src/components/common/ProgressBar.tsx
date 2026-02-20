import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "complete";
}

export default function ProgressBar({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white border-b border-slate-200">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step.status === "complete"
                  ? "bg-green-500 text-white"
                  : step.status === "active"
                    ? "bg-primary-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {step.status === "complete" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`text-xs whitespace-nowrap ${
                step.status === "active"
                  ? "text-primary-700 font-medium"
                  : step.status === "complete"
                    ? "text-green-700"
                    : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-2 ${
                step.status === "complete" ? "bg-green-300" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
