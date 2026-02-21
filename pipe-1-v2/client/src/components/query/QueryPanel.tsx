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
  { label: string; color: string; icon: React.ReactNode }
> = {
  high: {
    label: 'High confidence',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  medium: {
    label: 'Medium confidence',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: <HelpCircle className="w-3 h-3" />,
  },
  low: {
    label: 'Low confidence',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  not_found: {
    label: 'Not in DNA',
    color: 'text-gray-500 bg-gray-50 border-gray-200',
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

  // Auto-expand when history grows
  useEffect(() => {
    if (history.length > 0) setIsExpanded(true);
  }, [history.length]);

  // Scroll to bottom on new messages
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-gray-900">Ask about this project</span>
          {history.length > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              {history.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Conversation history */}
          {history.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-5 py-4">
              {history.map((item, i) => {
                const conf = CONFIDENCE_CONFIG[item.confidence] ?? CONFIDENCE_CONFIG.low;
                return (
                  <div key={i} className="space-y-2">
                    {/* User question */}
                    <div className="flex justify-end">
                      <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-lg shadow-sm">
                        {item.question}
                      </div>
                    </div>
                    {/* AI answer */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-lg">
                        <p className="whitespace-pre-wrap leading-relaxed">{item.answer}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${conf.color}`}
                          >
                            {conf.icon}
                            {conf.label}
                          </span>
                          {item.referencedSections?.length > 0 && (
                            <span className="text-xs text-gray-400">
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
                <div className="flex items-center gap-2 text-gray-400 text-sm pl-1">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  Querying DNA...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Suggested questions (only when no history yet) */}
          {history.length === 0 && !isQuerying && (
            <div className="py-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              disabled={isQuerying}
            />
            <button
              type="submit"
              disabled={!question.trim() || isQuerying}
              className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
