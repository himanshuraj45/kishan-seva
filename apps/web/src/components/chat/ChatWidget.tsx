/**
 * @file src/components/chat/ChatWidget.tsx
 * @description Floating AI Saathi chat widget rendered on every app page. Manages the open/collapsed state and delegates all voice/text logic to useVoiceChat.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Mic,
  Square,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  Loader2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useChatStore } from "@/lib/chatStore";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import ChatBubble from "./ChatBubble";
import LanguageSelector from "./LanguageSelector";

export default function ChatWidget() {
  const pathname = usePathname();
  const {
    isOpen,
    toggleOpen,
    messages,
    isListening,
    isSpeaking,
    isLoading,
    clearMessages,
    language,
  } = useChatStore();

  const [textInput, setTextInput] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isSpeechSupported,
    startListening,
    stopListening,
    sendMessage,
    stopSpeaking,
    sendGreeting,
  } = useVoiceChat(setTextInput);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send greeting when first opened
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      setTimeout(() => sendGreeting(language), 300);
    }
  }, [isOpen, hasGreeted, messages.length, language, sendGreeting]);

  const handleSend = () => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput(""); // clear immediately before async send
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <div className={`fixed bottom-28 lg:bottom-12 right-6 z-[99999] transition-all duration-500 w-16 h-16 flex items-center justify-center`}>
        {/* Pulse ring when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
        )}

        <button
          onClick={toggleOpen}
          aria-label="Open KisanSeva Chatbot"
          className={`relative w-full h-full rounded-full shadow-lg border border-slate-100 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen
              ? "bg-slate-800 hover:bg-slate-900"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center p-[2px]">
                <img src="/chatbot-avatar.jpg" alt="Chat" className="w-full h-full object-cover rounded-full" />
              </div>
              {/* Unread indicator dot */}
              {messages.length === 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" />
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-[144px] lg:bottom-24 right-6 z-[100] w-[360px] max-w-[calc(100vw-48px)] max-h-[520px] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#65a30d]/10 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                <img src="/chatbot-avatar.jpg" alt="KisanSeva Saathi" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-slate-900 font-extrabold text-sm leading-none">KisanSeva Saathi</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {isListening
                    ? "ðŸŽ™ï¸ Listening..."
                    : isSpeaking
                    ? "ðŸ”Š Speaking..."
                    : isLoading
                    ? "â³ Thinking..."
                    : "â— Online"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mute/unmute TTS */}
              <button
                onClick={isSpeaking ? stopSpeaking : undefined}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title={isSpeaking ? "Stop speaking" : "Sound on"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-slate-600" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Clear chat */}
              <button
                onClick={() => {
                  clearMessages();
                  setHasGreeted(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Language selector */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80 shrink-0">
            <LanguageSelector />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <MessageCircle className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  Starting conversation...
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <img src="/chatbot-avatar.jpg" alt="KS" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-end gap-2">
              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? language === "hi"
                        ? "ðŸŽ™ï¸ à¤¸à¥à¤¨ à¤°à¤¹à¤¾ à¤¹à¥‚à¤‚... à¤°à¥à¤•à¤¨à¥‡ à¤ªà¤° à¤­à¥‡à¤œ à¤¦à¥‡à¤—à¤¾"
                        : language === "bn"
                        ? "ðŸŽ™ï¸ à¦¶à§à¦¨à¦›à¦¿... à¦¥à¦¾à¦®à¦²à§‡à¦‡ à¦ªà¦¾à¦ à¦¾à¦¬à§‡"
                        : "ðŸŽ™ï¸ Listening... will send when you stop"
                      : language === "hi"
                      ? "à¤¯à¤¹à¤¾à¤ à¤Ÿà¤¾à¤‡à¤ª à¤•à¤°à¥‡à¤‚ à¤¯à¤¾ à¤®à¤¾à¤‡à¤• à¤¦à¤¬à¤¾à¤à¤‚..."
                      : language === "bn"
                      ? "à¦à¦–à¦¾à¦¨à§‡ à¦Ÿà¦¾à¦‡à¦ª à¦•à¦°à§à¦¨ à¦¬à¦¾ à¦®à¦¾à¦‡à¦• à¦šà¦¾à¦ªà§à¦¨..."
                      : "Type or click mic to speak..."
                  }
                  className={`w-full resize-none px-3.5 py-2.5 border rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent max-h-24 overflow-y-auto leading-snug transition-colors ${
                    isListening
                      ? "bg-red-50 border-red-200 focus:ring-red-400"
                      : "bg-white border-slate-200 focus:ring-[#65a30d]/50"
                  }`}
                  style={{ minHeight: "42px" }}
                />
              </div>

              {/* Voice toggle button */}
              {isSpeechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-40 ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-110"
                      : "bg-slate-100 hover:bg-[#65a30d]/10 hover:text-[#65a30d] text-slate-500 border border-slate-200"
                  }`}
                  title={isListening ? "Stop recording" : "Click to speak"}
                >
                  {/* Pulse ring while listening */}
                  {isListening && (
                    <span className="absolute inset-0 rounded-2xl bg-red-400 animate-ping opacity-40" />
                  )}
                  {isListening ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!textInput.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Voice hint */}
            {isSpeechSupported && (
              <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                {isListening
                  ? language === "hi"
                    ? "ðŸ”´ à¤¸à¥à¤¨ à¤°à¤¹à¤¾ à¤¹à¥‚à¤‚... à¤°à¥‹à¤•à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¦à¤¬à¤¾à¤à¤‚"
                    : language === "bn"
                    ? "ðŸ”´ à¦¶à§à¦¨à¦›à¦¿... à¦¥à¦¾à¦®à¦¾à¦¤à§‡ à¦šà¦¾à¦ªà§à¦¨"
                    : "ðŸ”´ Listening... click to stop"
                  : language === "hi"
                  ? "ðŸŽ™ï¸ à¤¬à¥‹à¤²à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤®à¤¾à¤‡à¤• à¤¦à¤¬à¤¾à¤à¤‚"
                  : language === "bn"
                  ? "ðŸŽ™ï¸ à¦•à¦¥à¦¾ à¦¬à¦²à¦¤à§‡ à¦®à¦¾à¦‡à¦• à¦šà¦¾à¦ªà§à¦¨"
                  : "ðŸŽ™ï¸ Click mic to speak"}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}


