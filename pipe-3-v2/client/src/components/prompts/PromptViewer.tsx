import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import type { AgentPrompt } from "../../types";
import ActionItemList from "./ActionItemList";
import CopyButton from "../common/CopyButton";

function formatPromptForCopy(prompt: AgentPrompt): string {
  const parts: string[] = [];

  parts.push(`# ${prompt.title}\n`);
  parts.push(`## System\n${prompt.system}\n`);

  if (prompt.context.prdSummary) {
    parts.push(`## PRD Summary\n${prompt.context.prdSummary}\n`);
  }

  if (prompt.context.impactedFiles.length > 0) {
    parts.push(`## Files to Work On\n${prompt.context.impactedFiles.map((f) => `- ${f}`).join("\n")}\n`);
  }

  if (prompt.context.relevantRepoConventions.length > 0) {
    parts.push(`## Repo Conventions\n${prompt.context.relevantRepoConventions.map((c) => `- ${c}`).join("\n")}\n`);
  }

  if (prompt.context.tokensOrConstraints.length > 0) {
    parts.push(`## Design Tokens & Constraints\n${prompt.context.tokensOrConstraints.map((t) => `- ${t}`).join("\n")}\n`);
  }

  if (prompt.instructions.length > 0) {
    parts.push(`## Instructions\n${prompt.instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}\n`);
  }

  if (prompt.guardrails.length > 0) {
    parts.push(`## Guardrails\n${prompt.guardrails.map((g) => `- ${g}`).join("\n")}\n`);
  }

  if (prompt.deliverables.length > 0) {
    parts.push(`## Deliverables\n${prompt.deliverables.map((d) => `- ${d}`).join("\n")}\n`);
  }

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
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left hover:bg-slate-50 -mx-4 -my-3 px-4 py-3 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Terminal className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-800 truncate">
              {prompt.title}
            </span>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </button>

        <CopyButton text={copyText} label="Copy Prompt" className="ml-3 flex-shrink-0" />
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
          {/* System prompt */}
          <div>
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              System Prompt
            </h5>
            <div className="bg-slate-900 text-green-400 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {prompt.system}
            </div>
          </div>

          {/* Context */}
          {prompt.context.impactedFiles.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Impacted Files
              </h5>
              <div className="flex flex-wrap gap-1">
                {prompt.context.impactedFiles.map((f) => (
                  <span key={f} className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
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
            <ActionItemList
              title="Evidence"
              items={prompt.context.evidence}
            />
          )}

          {/* Instructions */}
          <ActionItemList
            title="Instructions"
            items={prompt.instructions}
            ordered
          />

          {/* Guardrails */}
          <ActionItemList
            title="Guardrails"
            items={prompt.guardrails}
          />

          {/* Deliverables */}
          <ActionItemList
            title="Expected Deliverables"
            items={prompt.deliverables}
          />
        </div>
      )}
    </div>
  );
}
