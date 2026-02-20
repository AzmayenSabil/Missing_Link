import { useState } from "react";
import { Send } from "lucide-react";

interface SingleSelectInputProps {
  options: string[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export default function SingleSelectInput({ options, onSubmit, disabled }: SingleSelectInputProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            selected === opt
              ? "border-primary-500 bg-primary-50"
              : "border-slate-200 hover:border-slate-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            type="radio"
            name="single-select"
            checked={selected === opt}
            onChange={() => !disabled && setSelected(opt)}
            disabled={disabled}
            className="accent-primary-600"
          />
          <span className="text-sm text-slate-700">{opt}</span>
        </label>
      ))}
      <button
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected || disabled}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-3.5 h-3.5" />
        Submit
      </button>
    </div>
  );
}
