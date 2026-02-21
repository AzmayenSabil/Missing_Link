import { useState } from "react";
import { Send, Check } from "lucide-react";

interface MultiSelectInputProps {
  options: string[];
  onSubmit: (values: string[]) => void;
  disabled?: boolean;
}

export default function MultiSelectInput({
  options,
  onSubmit,
  disabled,
}: MultiSelectInputProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (opt: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      next.add(opt);
    }
    setSelected(next);
  };

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt) => {
        const isSelected = selected.has(opt);
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
              disabled ? "opacity-40 cursor-not-allowed" : ""
            }`}
            style={
              isSelected
                ? {
                    background: "linear-gradient(135deg, #8b5cf614, #00d4ff14)",
                    border: "1px solid #8b5cf644",
                  }
                : {
                    background: "#060d1f",
                    border: "1px solid #1a3055",
                  }
            }
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggle(opt)}
              disabled={disabled}
              className="sr-only"
            />
            {/* Custom checkbox */}
            <div
              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
              style={{
                border: `1px solid ${isSelected ? "#8b5cf6" : "#1a3055"}`,
                background: isSelected ? "#8b5cf622" : "transparent",
              }}
            >
              {isSelected && (
                <Check
                  className="w-2.5 h-2.5"
                  style={{
                    color: "#8b5cf6",
                    filter: "drop-shadow(0 0 3px #8b5cf6)",
                  }}
                />
              )}
            </div>
            <span
              className="text-sm font-mono"
              style={{ color: isSelected ? "#c8d8e8" : "#4a6080" }}
            >
              {opt}
            </span>
          </label>
        );
      })}
      <button
        onClick={() => selected.size > 0 && onSubmit([...selected])}
        disabled={selected.size === 0 || disabled}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #8b5cf622, #00d4ff22)",
          border: "1px solid #8b5cf644",
          color: "#8b5cf6",
        }}
      >
        <Send className="w-3.5 h-3.5" />
        Submit ({selected.size} selected)
      </button>
    </div>
  );
}
