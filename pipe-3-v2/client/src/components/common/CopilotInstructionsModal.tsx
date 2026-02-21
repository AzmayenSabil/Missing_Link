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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl slide-up"
        style={{
          background: "rgba(10,22,40,0.97)",
          border: "1px solid #00d4ff33",
          boxShadow:
            "0 0 40px #00d4ff11, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(0,212,255,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #1a3055" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen
              className="w-5 h-5"
              style={{
                color: "#8b5cf6",
                filter: "drop-shadow(0 0 4px #8b5cf6)",
              }}
            />
            <h2 className="text-base font-bold font-mono gradient-text-cyber">
              Copilot Instructions
            </h2>
            <span
              className="text-xs font-mono ml-1"
              style={{ color: "#64748b" }}
            >
              project-dna/copilot-instructions.md
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={
                copied
                  ? {
                      background: "rgba(0,255,163,0.1)",
                      border: "1px solid #00ffa355",
                      color: "#00ffa3",
                      boxShadow: "0 0 8px #00ffa322",
                    }
                  : {
                      background: "rgba(0,212,255,0.08)",
                      border: "1px solid #00d4ff33",
                      color: "#00d4ff",
                    }
              }
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy All
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00d4ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {copilotInstructions ? (
            <section>
              <h3
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: "#00d4ff55" }}
              >
                copilot-instructions.md
              </h3>
              <pre
                className="text-sm rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed"
                style={{
                  background: "#0f1f3a",
                  color: "#00d4ffcc",
                  border: "1px solid #1a3055",
                }}
              >
                {copilotInstructions.trim()}
              </pre>
            </section>
          ) : (
            <p
              className="text-sm font-mono italic"
              style={{ color: "#64748b" }}
            >
              // copilot-instructions.md not found in this pipe-1 run
            </p>
          )}

          {systemPromptEntries.length > 0 && (
            <section>
              <h3
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: "#8b5cf655" }}
              >
                system-prompts.json
              </h3>
              <div className="space-y-4">
                {systemPromptEntries.map(([key, value]) => (
                  <div key={key}>
                    <p
                      className="text-xs font-mono mb-1"
                      style={{
                        color: "#8b5cf6",
                        textShadow: "0 0 8px #8b5cf655",
                      }}
                    >
                      // {key}
                    </p>
                    <pre
                      className="text-sm rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed"
                      style={{
                        background: "#0f1f3a",
                        color: "#e2e8f0cc",
                        border: "1px solid #1a3055",
                      }}
                    >
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
