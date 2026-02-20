import type { ReactNode } from "react";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "ai" | "system";
  children: ReactNode;
}

export default function MessageBubble({ role, children }: MessageBubbleProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-slate-100 text-slate-500 text-xs px-4 py-1.5 rounded-full">
          {children}
        </div>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""} max-w-[85%] ${isUser ? "ml-auto" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary-600" : "bg-primary-100"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-primary-700" />
        )}
      </div>
      <div
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary-600 text-white rounded-tr-sm"
            : "bg-chat-ai text-slate-800 rounded-tl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
