export default function TypingIndicator({ text }: { text?: string }) {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <span className="text-primary-700 text-xs font-bold">AI</span>
      </div>
      <div className="bg-chat-ai rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
          <div className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
          <div className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
        </div>
        {text && <p className="text-xs text-slate-500 mt-1">{text}</p>}
      </div>
    </div>
  );
}
