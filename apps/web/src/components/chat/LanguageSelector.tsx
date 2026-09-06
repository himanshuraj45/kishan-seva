"use client";

import { useChatStore, ChatLanguage } from "@/lib/chatStore";
import { useVoiceChat } from "@/hooks/useVoiceChat";

const LANGUAGES: { code: ChatLanguage; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "hi", label: "हिं", flag: "🇮🇳" },
  { code: "bn", label: "বাং", flag: "🇮🇳" },
];

export default function LanguageSelector() {
  const { language, setLanguage, clearMessages } = useChatStore();
  const { sendGreeting, stopSpeaking: stopVoice } = useVoiceChat();

  const handleChange = (lang: ChatLanguage) => {
    if (lang === language) return; // already selected
    // Stop any ongoing speech first
    stopVoice();
    // Switch language, wipe previous conversation, send fresh greeting
    setLanguage(lang);
    clearMessages();
    // Small delay so state settles before greeting fires
    setTimeout(() => sendGreeting(lang), 400);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            language === l.code
              ? "bg-white text-[#65a30d] shadow-sm scale-105"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
          }`}
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}

