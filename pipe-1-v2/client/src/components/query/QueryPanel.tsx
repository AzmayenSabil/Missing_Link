import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, MessageCircle, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import type { QueryResult, ConfidenceLevel } from '../../types';

const SUGGESTED_QUESTIONS = [
  'What are the main modules in this project?',
  'What API endpoints are available?',
  'What naming conventions does this project use?',
  'What tech stack is used?',
  'What are the key architectural decisions?',
  'What authentication method is used?',
  'How is state managed in this application?',
];

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  high: {
    label: 'High confidence',
    bg: '#00ffa310',
    border: '#00ffa333',
    text: '#00ffa3',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  medium: {
    label: 'Medium confidence',
    bg: '#ffd60010',
    border: '#ffd60033',
    text: '#ffd600',
    icon: <HelpCircle className="w-3 h-3" />,
  },
  low: {
    label: 'Low confidence',
    bg: '#ff7a0010',
    border: '#ff7a0033',
    text: '#ff7a00',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  not_found: {
    label: 'Not in DNA',
    bg: '#94a3b810',
    border: '#94a3b833',
    text: '#94a3b8',
    icon: <HelpCircle className="w-3 h-3" />,
  },
};

interface QueryPanelProps {
  projectId: string;
  history: QueryResult[];
  isQuerying: boolean;
  onQuery: (question: string) => Promise<void>;
}

export default function QueryPanel({ history, isQuerying, onQuery }: QueryPanelProps) {
  const [question, setQuestion] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (history.length > 0) setIsExpanded(true);
  }, [history.length]);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [history.length, isQuerying, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || isQuerying) return;
    setQuestion('');
    await onQuery(q);
  };

  const handleSuggestion = (q: string) => {
    setQuestion(q);
    inputRef.current?.focus();
  };

  return (
    <div className="rounded-xl overflow-hidden cyber-border" style={{ background: '#0d1830' }}>
      {/* Header / toggle */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-cyber-card transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 neon-text" />
          <span className="font-semibold text-slate-200">Ask about this project</span>
          {history.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#00d4ff15', color: '#00d4ff', border: '1px solid #00d4ff33' }}
            >
              {history.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid #1a3055' }}>
          {/* Conversation history */}
          {history.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-5 py-4">
              {history.map((item, i) => {
                const conf = CONFIDENCE_CONFIG[item.confidence] ?? CONFIDENCE_CONFIG.low;
                return (
                  <div key={i} className="space-y-2">
                    {/* User question */}
                    <div className="flex justify-end">
                      <div
                        className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-lg text-white"
                        style={{ background: '#0090b2', boxShadow: '0 2px 8px rgba(0,144,178,0.3)' }}
                      >
                        {item.question}
                      </div>
                    </div>
                    {/* AI answer */}
                    <div className="flex justify-start">
                      <div
                        className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-lg"
                        style={{ background: '#0f1f3a', border: '1px solid #1a3055' }}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-300">{item.answer}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #1a3055' }}>
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: conf.bg, border: `1px solid ${conf.border}`, color: conf.text }}
                          >
                            {conf.icon}
                            {conf.label}
                          </span>
                          {item.referencedSections?.length > 0 && (
                            <span className="text-xs text-slate-500">
                              → {item.referencedSections.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isQuerying && (
                <div className="flex items-center gap-2 text-slate-500 text-sm pl-1">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                  Querying DNA...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Suggested questions */}
          {history.length === 0 && !isQuerying && (
            <div className="py-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    className="text-xs px-3 py-1.5 rounded-full text-slate-400 hover:text-primary-400 transition-colors"
                    style={{ border: '1px solid #1a3055', background: '#0f1f3a' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about this project's architecture, APIs, conventions..."
              className="flex-1 border border-cyber-border bg-cyber-bg rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
              disabled={isQuerying}
            />
            <button
              type="submit"
              disabled={!question.trim() || isQuerying}
              className="rounded-xl px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #00d4ff22, #00d4ff11)',
                border: '1px solid #00d4ff44',
                color: '#00d4ff',
              }}
            >
              {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
