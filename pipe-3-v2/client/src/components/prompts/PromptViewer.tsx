import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import type { AgentPrompt } from "../../types";
import ActionItemList from "./ActionItemList";
import CopyButton from "../common/CopyButton";

function formatPromptForCopy(prompt: AgentPrompt): string {
  const parts: string[] = [];
  parts.push(`# ${prompt.title}\n`);
  parts.push(`## System\n${prompt.system}\n`);
  if (prompt.context.prdSummary)
    parts.push(`## PRD Summary\n${prompt.context.prdSummary}\n`);
  if (prompt.context.impactedFiles.length > 0)
    parts.push(
      `## Files to Work On\n${prompt.context.impactedFiles.map((f) => `- ${f}`).join("\n")}\n`,
    );
  if (prompt.context.relevantRepoConventions.length > 0)
    parts.push(
      `## Repo Conventions\n${prompt.context.relevantRepoConventions.map((c) => `- ${c}`).join("\n")}\n`,
    );
  if (prompt.context.tokensOrConstraints.length > 0)
    parts.push(
      `## Design Tokens & Constraints\n${prompt.context.tokensOrConstraints.map((t) => `- ${t}`).join("\n")}\n`,
    );
  if (prompt.instructions.length > 0)
    parts.push(
      `## Instructions\n${prompt.instructions.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n`,
    );
  if (prompt.guardrails.length > 0)
    parts.push(
      `## Guardrails\n${prompt.guardrails.map((g) => `- ${g}`).join("\n")}\n`,
    );
  if (prompt.deliverables.length > 0)
    parts.push(
      `## Deliverables\n${prompt.deliverables.map((d) => `- ${d}`).join("\n")}\n`,
    );
  return parts.join("\n");
}

export default function PromptViewer({
  prompt,
  index,
}: {
  prompt: AgentPrompt;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const copyText = formatPromptForCopy(prompt);

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(10,22,40,0.8)",
        border: expanded ? "1px solid #00ffa322" : "1px solid #1a3055",
        boxShadow: expanded ? "0 0 12px #00ffa30a" : "none",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left -mx-4 -my-3 px-4 py-3 transition-colors"
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,255,163,0.02)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          {/* Index badge */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #00ffa322, #00d4ff22)",
              border: "1px solid #00ffa333",
              color: "#00ffa3",
              boxShadow: "0 0 6px #00ffa322",
            }}
          >
            {index + 1}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Terminal
              className="w-4 h-4 flex-shrink-0"
              style={{
                color: "#00ffa366",
                filter: "drop-shadow(0 0 3px #00ffa344)",
              }}
            />
            <span
              className="text-sm font-semibold truncate"
              style={{ color: "#e2e8f0" }}
            >
              {prompt.title}
            </span>
          </div>
          {expanded ? (
            <ChevronDown
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "#00ffa366" }}
            />
          ) : (
            <ChevronRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "#64748b" }}
            />
          )}
        </button>

        <CopyButton
          text={copyText}
          label="Copy"
          className="ml-3 flex-shrink-0"
        />
      </div>

      {expanded && (
        <div
          className="px-4 pb-4 pt-2 space-y-4"
          style={{ borderTop: "1px solid #0d1e35" }}
        >
          {/* System prompt */}
          <div>
            <h5
              className="text-xs font-mono tracking-widest uppercase mb-2"
              style={{ color: "#00ffa355" }}
            >
              System Prompt
            </h5>
            <div
              className="rounded-lg p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto"
              style={{
                background: "#0f1f3a",
                color: "#00ffa3cc",
                border: "1px solid #00ffa322",
              }}
            >
              {prompt.system}
            </div>
          </div>

          {/* Impacted files */}
          {prompt.context.impactedFiles.length > 0 && (
            <div>
              <h5
                className="text-xs font-mono tracking-widest uppercase mb-2"
                style={{ color: "#00d4ff44" }}
              >
                Impacted Files
              </h5>
              <div className="flex flex-wrap gap-1">
                {prompt.context.impactedFiles.map((f) => (
                  <span
                    key={f}
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                      background: "#00d4ff08",
                      color: "#00d4ffcc",
                      border: "1px solid #00d4ff22",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {prompt.context.relevantRepoConventions.length > 0 && (
            <ActionItemList
              title="Repo Conventions"
              items={prompt.context.relevantRepoConventions}
            />
          )}

          {prompt.context.evidence.length > 0 && (
            <ActionItemList title="Evidence" items={prompt.context.evidence} />
          )}

          <ActionItemList
            title="Instructions"
            items={prompt.instructions}
            ordered
          />
          <ActionItemList title="Guardrails" items={prompt.guardrails} />
          <ActionItemList
            title="Expected Deliverables"
            items={prompt.deliverables}
          />
        </div>
      )}
    </div>
  );
}
