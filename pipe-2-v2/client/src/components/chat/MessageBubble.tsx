import type { ReactNode } from "react";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "ai" | "system";
  children: ReactNode;
}

export default function MessageBubble({ role, children }: MessageBubbleProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center my-3 slide-up">
        <div
          className="text-xs px-4 py-1.5 rounded-full font-mono tracking-widest uppercase"
          style={{
            background: "linear-gradient(135deg, #0f1f3a, #111d30)",
            border: "1px solid #1a3055",
            color: "#94a3b8",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div
      className={`flex items-start gap-3 slide-up ${isUser ? "flex-row-reverse" : ""} max-w-[85%] ${isUser ? "ml-auto" : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative"
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #0090b2, #006e88)",
                border: "1px solid #00d4ff44",
                boxShadow: "0 0 10px #00d4ff22",
              }
            : {
                background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
                border: "1px solid #00d4ff44",
                boxShadow: "0 0 12px #00d4ff22",
              }
        }
      >
        {isUser ? (
          <User className="w-4 h-4" style={{ color: "#e2e8f0" }} />
        ) : (
          <Bot
            className="w-4 h-4"
            style={{ color: "#00d4ff", filter: "drop-shadow(0 0 4px #00d4ff)" }}
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`rounded-2xl px-4 py-3 ${isUser ? "rounded-tr-sm" : "rounded-tl-sm corner-bracket"}`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #0090b2, #006e88)",
                border: "1px solid #00d4ff44",
                color: "#f0faff",
                boxShadow: "0 4px 16px rgba(0,144,178,0.25)",
              }
            : {
                background: "linear-gradient(135deg, #0f1f3a, #111d30)",
                border: "1px solid #1a3055",
                color: "#cbd5e1",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,212,255,0.06)",
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
