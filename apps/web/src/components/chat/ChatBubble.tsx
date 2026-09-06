/**
 * @file src/components/chat/ChatBubble.tsx
 * @description Single message bubble component for the AI Saathi chat thread. Renders markdown content and optional quick-action buttons.
 */
"use client";

import { useRouter } from "next/navigation";
import { Volume2, ArrowRight, ExternalLink } from "lucide-react";
import { ChatMessage } from "@/lib/chatStore";
import { useChatStore } from "@/lib/chatStore";
import { useVoiceChat } from "@/hooks/useVoiceChat";

interface ChatBubbleProps {
  message: ChatMessage;
}

const ACTION_LABELS: Record<string, { label: string; href: string; hi: string }> = {
  diagnose: {
    label: "Diagnose Crop",
    hi: "à¤«à¤¸à¤² à¤•à¤¾ à¤¨à¤¿à¤¦à¤¾à¤¨ à¤•à¤°à¥‡à¤‚",
    href: "/diagnose",
  },
  market: {
    label: "Check Market Prices",
    hi: "à¤¬à¤¾à¤œà¤¾à¤° à¤­à¤¾à¤µ à¤œà¤¾à¤‚à¤šà¥‡à¤‚",
    href: "/market",
  },
  schedule: {
    label: "View My Plots",
    hi: "à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤® à¤¦à¥‡à¤–à¥‡à¤‚",
    href: "/schedule",
  },
  schemes: {
    label: "View Government Schemes",
    hi: "à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤¯à¥‹à¤œà¤¨à¤¾à¤à¤‚ à¤¦à¥‡à¤–à¥‡à¤‚",
    href: "/schemes",
  }
};

// Lightweight markdown-to-JSX renderer for bot replies
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={i} className="h-1.5" />);
      return;
    }

    // Bullet point: starts with â€¢ or - or *
    if (/^[â€¢\-\*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[â€¢\-\*]\s/, "");
      // Bold scheme name before colon
      const parts = content.split(/:(.*)/);
      elements.push(
        <div key={i} className="flex items-start gap-1.5 mt-1">
          <span className="text-[#65a30d] font-bold mt-0.5 shrink-0">â€¢</span>
          <span>
            {parts.length > 1 ? (
              <>
                <span className="font-bold text-slate-900">{parts[0]}</span>
                <span className="text-slate-600">:{parts[1]}</span>
              </>
            ) : (
              <span>{content}</span>
            )}
          </span>
        </div>
      );
      return;
    }

    // Normal line â€” inline bold via **text**
    const inlineBold = trimmed.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) => {
      if (chunk.startsWith("**") && chunk.endsWith("**")) {
        return (
          <span key={j} className="font-bold text-slate-900">
            {chunk.slice(2, -2)}
          </span>
        );
      }
      return <span key={j}>{chunk}</span>;
    });

    elements.push(
      <p key={i} className={i === 0 ? "" : "mt-1.5"}>
        {inlineBold}
      </p>
    );
  });

  return elements;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const router = useRouter();
  const { language } = useChatStore();
  const { speak } = useVoiceChat();
  const isUser = message.role === "user";

  const actionConfig = message.action ? ACTION_LABELS[message.action] : null;
  const actionLabel = actionConfig
    ? language === "hi"
      ? actionConfig.hi
      : actionConfig.label
    : null;

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mb-1 overflow-hidden border border-slate-200 shadow-sm">
          <img src="/chatbot-avatar.jpg" alt="KS" className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className={`max-w-[84%] space-y-2 ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {/* Message bubble */}
        <div
          className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-[#65a30d] text-white rounded-br-sm"
              : "bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(message.text)}</div>
          )}

          {/* Re-read button */}
          {!isUser && (
            <button
              onClick={() => speak(message.text, language)}
              className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#ecfccb] hover:bg-[#d9f99d] text-[#65a30d] rounded-full flex items-center justify-center shadow-sm transition-colors"
              title="Read aloud"
            >
              <Volume2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action CTA button */}
        {actionConfig && actionLabel && (
          <button
            onClick={() => router.push(actionConfig.href)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#4d7c0f] bg-[#ecfccb] hover:bg-[#d9f99d] border border-[#bef264] px-3 py-1.5 rounded-xl transition-all hover:shadow-sm group"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {actionLabel}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}


