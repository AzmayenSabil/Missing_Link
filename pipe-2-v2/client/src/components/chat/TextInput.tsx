import { useState } from "react";
import { Send } from "lucide-react";

interface TextInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({
  onSubmit,
  disabled,
  placeholder,
}: TextInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div className="flex gap-2 mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder || "Type your answer..."}
        disabled={disabled}
        className="flex-1 px-4 py-2 rounded-lg text-sm font-mono focus:outline-none disabled:opacity-40"
        style={{
          background: "#060d1f",
          border: "1px solid #1a3055",
          color: "#c8d8e8",
          caretColor: "#00d4ff",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#00d4ff44";
          e.currentTarget.style.boxShadow = "0 0 0 2px #00d4ff11";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#1a3055";
          e.currentTarget.style.boxShadow = "none";
        }}
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="px-3 py-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
          border: "1px solid #00d4ff44",
          color: "#00d4ff",
        }}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
