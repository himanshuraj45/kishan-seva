/**
 * @file apps/web/src/lib/chatStore.ts
 * @description Global Zustand store for the KisanSeva AI Saathi chat widget.
 *
 * Centralises all chat UI state — open/closed, language preference, message
 * history, and async status flags (listening, speaking, loading). Import
 * `useChatStore` in any client component that needs to read or mutate chat
 * state without prop-drilling.
 */
import { create } from "zustand";

/** Supported languages for AI responses and TTS playback. */
export type ChatLanguage = "en" | "hi" | "bn";

/** A single message in the chat thread (from farmer or AI model). */
export interface ChatMessage {
  /** Unique ID generated at creation time (e.g. `crypto.randomUUID()`). */
  id: string;
  /** Author of the message — 'user' for the farmer, 'model' for the AI. */
  role: "user" | "model";
  /** Displayed text content. May include markdown. */
  text: string;
  /** Optional action slug returned by the AI (e.g. "open_market"). */
  action?: string | null;
  /** Human-readable hint explaining the action button label. */
  action_hint?: string | null;
  /** Wall-clock timestamp of when the message was added to the store. */
  timestamp: Date;
}

interface ChatStore {
  isOpen: boolean;
  language: ChatLanguage;
  messages: ChatMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setLanguage: (lang: ChatLanguage) => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  language: "en",
  messages: [],
  isListening: false,
  isSpeaking: false,
  isLoading: false,
  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setLanguage: (language) => set({ language }),
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: new Date() },
      ],
    })),
  setListening: (isListening) => set({ isListening }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}));

