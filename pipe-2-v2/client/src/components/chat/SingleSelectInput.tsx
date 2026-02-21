import { useState } from "react";
import { Send } from "lucide-react";

interface SingleSelectInputProps {
  options: string[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export default function SingleSelectInput({
  options,
  onSubmit,
  disabled,
}: SingleSelectInputProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
              disabled ? "opacity-40 cursor-not-allowed" : ""
            }`}
            style={
              isSelected
                ? {
                    background: "linear-gradient(135deg, #00d4ff14, #8b5cf614)",
                    border: "1px solid #00d4ff44",
                  }
                : {
                    background: "#060d1f",
                    border: "1px solid #1a3055",
                  }
            }
          >
            <input
              type="radio"
              name="single-select"
              checked={isSelected}
              onChange={() => !disabled && setSelected(opt)}
              disabled={disabled}
              className="sr-only"
            />
            {/* Custom radio */}
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                border: `1px solid ${isSelected ? "#00d4ff" : "#1a3055"}`,
                background: isSelected ? "#00d4ff22" : "transparent",
              }}
            >
              {isSelected && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "#00d4ff",
                    boxShadow: "0 0 4px #00d4ff",
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
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected || disabled}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
          border: "1px solid #00d4ff44",
          color: "#00d4ff",
        }}
      >
        <Send className="w-3.5 h-3.5" />
        Submit
      </button>
    </div>
  );
}
