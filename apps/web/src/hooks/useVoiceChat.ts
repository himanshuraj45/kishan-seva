/**
 * @file apps/web/src/hooks/useVoiceChat.ts
 * @description React hook encapsulating all voice I/O for the AI Saathi chat.
 *
 * Manages the full voice pipeline:
 *  - Audio recording via `MediaRecorder` (works over plain HTTP — no HTTPS needed)
 *  - Transcription via the Groq Whisper API proxy at `/api/transcribe`
 *  - Text-to-speech playback via Google Translate TTS proxy at `/api/v1/tts`
 *    with a fallback to the browser's native `SpeechSynthesis` API
 *
 * State (messages, language, loading flags) lives in `useChatStore` (Zustand).
 * This hook is intentionally side-effect-free on mount — it only activates
 * when the farmer explicitly presses the microphone button.
 *
 * @returns An object with `startListening`, `stopListening`, `speak`, and
 *          `sendTextMessage` handlers, plus derived boolean flags.
 */
"use client";

import { useCallback, useRef, useEffect } from "react";
import type React from "react";
import { useChatStore, ChatLanguage } from "@/lib/chatStore";

const LANG_CODE_MAP: Record<ChatLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
};

// Greeting messages per language
const GREETINGS: Record<ChatLanguage, string> = {
  en: "Hello! I'm KisanSeva Saathi. How can I help you today? You can ask me about crop diseases, market prices, or government schemes.",
  hi: "नमस्ते! मैं किसान सेवा साथी हूं। आज मैं आपकी कैसे मदद कर सकता हूं? आप फसल रोगों, बाजार भाव या सरकारी योजनाओं के बारे में पूछ सकते हैं।",
  bn: "নমস্কার! আমি কিষান সেবা সাথী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি? আপনি আমাকে ফসলের রোগ, বাজারের দাম বা সরকারি স্কিম সম্পর্কে জিজ্ঞাসা করতে পারেন।",
};

// Google Translate TTS language codes
const GTTS_LANG_MAP: Record<ChatLanguage, string> = {
  en: 'en',
  hi: 'hi',
  bn: 'bn',
};

// Check if browser has a native voice for this language
function hasNativeVoice(synth: SpeechSynthesis, lang: ChatLanguage): boolean {
  const voices = synth.getVoices();
  const primary = LANG_CODE_MAP[lang].split("-")[0];
  return voices.some((v) => v.lang.toLowerCase().startsWith(primary));
}

// Build Google Translate TTS URL — works without API key, max 200 chars per request
function buildGTTSUrl(text: string, lang: ChatLanguage): string {
  const encoded = encodeURIComponent(text.slice(0, 200));
  // Use our Next.js API proxy to bypass browser CORS restrictions
  return `/api/v1/tts?text=${encoded}&lang=${GTTS_LANG_MAP[lang]}`;
}

// Speak using HTML Audio element (Google Translate TTS)
async function speakWithGTTS(
  text: string,
  lang: ChatLanguage,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  onStart: () => void,
  onEnd: () => void
) {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  // Strip markdown and emojis
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (!cleanText) { onEnd(); return; }

  // Split into chunks of max 180 chars at sentence boundaries
  const chunks: string[] = [];
  const sentences = cleanText.match(/[^.!?।,:\n]+[.!?।,:\n]*/g) || [cleanText];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > 180) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  onStart();
  let i = 0;

  const playNext = async () => {
    if (i >= chunks.length) { onEnd(); return; }
    const url = buildGTTSUrl(chunks[i], lang);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { i++; playNext(); };
    audio.onerror = () => { i++; playNext(); };
    try { await audio.play(); } catch { i++; playNext(); }
  };

  await playNext();
}

// Best native voice for English
function getBestEnVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  const google = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en"));
  if (google) return google;
  return voices.find((v) => v.lang.startsWith("en")) || null;
}

export function useVoiceChat(onTranscript?: (text: string) => void) {
  const {
    language,
    messages,
    isListening,
    isSpeaking,
    isLoading,
    addMessage,
    setListening,
    setSpeaking,
    setLoading,
  } = useChatStore();

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voicesCachedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;

    // Chrome loads voices asynchronously — trigger early cache
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      voicesCachedRef.current = true;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      voicesCachedRef.current = true;
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices, { once: true });
    }

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const isSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const isCancelledRef = useRef<boolean>(false);

  const speak = useCallback(
    (text: string, lang: ChatLanguage = language) => {
      if (!text.trim()) return;

      // ── For Hindi and Bengali: use Google Translate TTS (reliable, no voice pack needed) ──
      if (lang === 'hi' || lang === 'bn') {
        // Stop any existing Web Speech and GTTS
        synthRef.current?.cancel();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        // Reset cancelled flag so Web Speech doesn't think it's cancelled
        isCancelledRef.current = false;

        speakWithGTTS(
          text,
          lang,
          audioRef,
          () => setSpeaking(true),
          () => setSpeaking(false)
        );
        return;
      }

      // ── For English: use native Web Speech API ──
      if (!synthRef.current) return;
      synthRef.current.cancel();
      isCancelledRef.current = false;

      // Stop any GTTS audio
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

      setTimeout(() => {
        const cleanText = text
          .replace(/[#*`_~]/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/[\u{1F000}-\u{1FFFF}]/gu, '');

        const chunks = cleanText.match(/[^.!?\n]+[.!?\n]*/g) || [cleanText];
        let currentIndex = 0;

        const speakNextChunk = () => {
          if (!synthRef.current || isCancelledRef.current || currentIndex >= chunks.length) {
            setSpeaking(false);
            utteranceRef.current = null;
            return;
          }

          const chunkText = chunks[currentIndex].trim();
          if (!chunkText || !/[a-zA-Z0-9]/.test(chunkText)) {
            currentIndex++;
            speakNextChunk();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(chunkText);
          utteranceRef.current = utterance;
          utterance.lang = 'en-IN';
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          const voice = getBestEnVoice(synthRef.current);
          if (voice) utterance.voice = voice;
          if (currentIndex === 0) setSpeaking(true);
          utterance.onend = () => { currentIndex++; speakNextChunk(); };
          utterance.onerror = (e) => {
            if (e.error !== 'interrupted') console.warn('TTS error:', e.error);
            currentIndex++;
            speakNextChunk();
          };
          synthRef.current.speak(utterance);
        };

        speakNextChunk();
      }, 50);
    },
    [language, setSpeaking]
  );

  const stopSpeaking = useCallback(() => {
    isCancelledRef.current = true;
    synthRef.current?.cancel();
    // Also stop GTTS audio if playing
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
    utteranceRef.current = null;
  }, [setSpeaking]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      addMessage({ role: "user", text });
      setLoading(true);

      // Build history for context (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const FALLBACK_ERROR: Record<string, string> = {
        en: "Sorry, I couldn't connect to the server. Please try again.",
        hi: "क्षमा करें, सर्वर से कनेक्ट नहीं हो सका। कृपया दोबारा कोशिश करें।",
        bn: "দুঃখিত, সার্ভারের সাথে সংযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      };

      try {
        const res = await fetch(`/api/v1/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text, language, plot_id: undefined }),
          signal: AbortSignal.timeout(30_000),
        });

        const data = await res.json();

        // If server returned an error status, show language-aware fallback
        if (!res.ok) {
          console.error("[Chat API] Error response:", res.status, data);
          throw new Error(data?.error || `Server error ${res.status}`);
        }
        
        // Parse the nested result structure from our API
        const replyText = data?.result?.text ||
          (language === "hi"
            ? "माफ़ करें, मैं आपका प्रश्न समझ नहीं पाया। कृपया दोबारा पूछें।"
            : language === "bn"
            ? "দুঃখিত, আমি আপনার প্রশ্ন বুঝতে পারিনি। দয়া করে আবার জিজ্ঞাসা করুন।"
            : "I'm sorry, I couldn't understand that. Please try again.");

        addMessage({ role: "model", text: replyText });

        // Clean markdown for speech so TTS doesn't read asterisks and hashtags
        const speechText = replyText
          .replace(/[#*`_~]/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/\n+/g, '. ')
          .trim();

        speak(speechText, language);
      } catch (err: any) {
        const errMsg = FALLBACK_ERROR[language] || FALLBACK_ERROR.en;
        addMessage({ role: "model", text: errMsg });
        speak(errMsg, language);
      } finally {
        setLoading(false);
      }
    },
    [messages, language, addMessage, setLoading, speak]
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    if (isListening) {
      // Stop if already recording
      mediaRecorderRef.current?.stop();
      return;
    }

    // Stop any ongoing TTS
    synthRef.current?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);

    try {
      // Check permission state first using Permissions API
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          const siteUrl = encodeURIComponent(window.location.origin);
          addMessage({
            role: 'model',
            text: language === 'hi'
              ? `माइक्रोफ़ोन स्थायी रूप से ब्लॉक है। Chrome में यह लिंक खोलें:\nchrome://settings/content/siteDetails?site=${siteUrl}\nफिर Microphone → Allow करें और पेज रिफ्रेश करें।`
              : `🎤 Microphone is permanently blocked for this site.\n\nTo fix it in Chrome:\n1. Copy and paste this in a new tab: chrome://settings/content/siteDetails?site=${siteUrl}\n2. Find Microphone → change to "Allow"\n3. Refresh this page and try again\n\nOR: Click the 🔒 icon in the address bar → Site settings → Microphone → Allow`,
          });
          return;
        }
      }

      // Request mic — will show browser permission popup if not yet decided
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setListening(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) return; // Too short — ignore

        // Send to our Whisper transcription endpoint
        setLoading(true);
        try {
          const fd = new FormData();
          fd.append('audio', audioBlob, 'audio.webm');
          fd.append('language', language);

          const resp = await fetch('/api/transcribe', { method: 'POST', body: fd });
          if (!resp.ok) throw new Error(`Transcribe failed: ${resp.status}`);
          const { text } = await resp.json();

          if (text && text.trim()) {
            onTranscript?.('');
            sendMessage(text.trim());
          }
        } catch (err) {
          console.error('[Voice] Transcription error:', err);
          addMessage({
            role: 'model',
            text: language === 'hi'
              ? 'आवाज़ पहचानने में त्रुटि। कृपया टाइप करके अपना संदेश भेजें।'
              : '🎤 Could not transcribe audio. Please type your message instead.',
          });
        } finally {
          setLoading(false);
        }
      };

      setListening(true);
      recorder.start();

      // Auto-stop after 8 seconds if user doesn't stop manually
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 8000);

    } catch (err: any) {
      console.error('[Voice] Mic error:', err);
      setListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        addMessage({
          role: 'model',
          text: language === 'hi'
            ? 'माइक्रोफ़ोन एक्सेस ब्लॉक है। URL बार में 🔒 आइकन → Site settings → Microphone → Allow → पेज रिफ्रेश करें।'
            : language === 'bn'
            ? 'মাইক্রোফোন ব্লক। 🔒 আইকনে ক্লিক করুন → Site settings → Microphone → Allow → রিফ্রেশ।'
            : '🎤 Microphone blocked. Click the 🔒 lock icon in your browser address bar → Site settings → Microphone → Allow → Refresh page.',
        });
      } else {
        addMessage({
          role: 'model',
          text: `🎤 Could not access microphone: ${err.message}`,
        });
      }
    }
  }, [isListening, language, onTranscript, setListening, setSpeaking, setLoading, addMessage, sendMessage]);

  // Stop listening early
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    setListening(false);
  }, [setListening]);


  const sendGreeting = useCallback(
    (lang: ChatLanguage) => {
      const greeting = GREETINGS[lang];
      addMessage({ role: "model", text: greeting, action: null });
      // Directly call speakWithGTTS for Hindi/Bengali to avoid stale closure bugs with the speak callback
      if (lang === 'hi' || lang === 'bn') {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        synthRef.current?.cancel();
        speakWithGTTS(greeting, lang, audioRef, () => setSpeaking(true), () => setSpeaking(false));
      } else {
        speak(greeting, lang);
      }
    },
    [addMessage, speak, setSpeaking]
  );

  return {
    isSpeechSupported,
    isListening,
    isSpeaking,
    isLoading,
    startListening,
    stopListening,
    sendMessage,
    speak,
    stopSpeaking,
    sendGreeting,
  };
}

