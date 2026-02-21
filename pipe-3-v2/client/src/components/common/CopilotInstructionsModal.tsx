/**
 * CopilotInstructionsModal – displays project-dna/copilot-instructions.md
 * with a copy-to-clipboard button.
 */

import { useEffect, useState } from "react";
import { X, Copy, Check, BookOpen } from "lucide-react";

interface CopilotInstructionsModalProps {
  copilotInstructions: string;
  systemPrompts: Record<string, unknown>;
  onClose: () => void;
}

export default function CopilotInstructionsModal({
  copilotInstructions,
  systemPrompts,
  onClose,
}: CopilotInstructionsModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = async () => {
    const parts: string[] = [];
    if (copilotInstructions) {
      parts.push("# Copilot Instructions\n\n" + copilotInstructions.trim());
    }
    const spEntries = Object.entries(systemPrompts);
    if (spEntries.length > 0) {
      parts.push(
        "# System Prompts\n\n" +
          spEntries
            .map(
              ([k, v]) =>
                `**${k}**\n${typeof v === "string" ? v : JSON.stringify(v, null, 2)}`,
            )
            .join("\n\n"),
      );
    }
    await navigator.clipboard.writeText(parts.join("\n\n---\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const systemPromptEntries = Object.entries(systemPrompts);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-800">
              Copilot Instructions
            </h2>
            <span className="text-xs text-slate-400 ml-1">
              project-dna/copilot-instructions.md
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Copilot instructions */}
          {copilotInstructions ? (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                copilot-instructions.md
              </h3>
              <pre className="bg-slate-950 text-slate-100 text-sm rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {copilotInstructions.trim()}
              </pre>
            </section>
          ) : (
            <p className="text-sm text-slate-400 italic">
              copilot-instructions.md not found in this pipe-1 run.
            </p>
          )}

          {/* System prompts */}
          {systemPromptEntries.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                system-prompts.json
              </h3>
              <div className="space-y-4">
                {systemPromptEntries.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-indigo-700 mb-1">
                      {key}
                    </p>
                    <pre className="bg-slate-950 text-slate-100 text-sm rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {typeof value === "string"
                        ? value
                        : JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
