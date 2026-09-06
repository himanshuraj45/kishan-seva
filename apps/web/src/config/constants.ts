/**
 * @file src/config/constants.ts
 * @description Application-wide constants for KisanSeva.
 *
 * Centralises all magic strings, API endpoints, model names, and numeric
 * thresholds in one discoverable location.
 * Import via: `import { GROQ_MODELS, ML_SERVICE_URL } from '@/config/constants'`
 */

/** Base URL of the Render-hosted Python ML backend. */
export const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_URL ?? 'https://kisanseva-api.onrender.com';

/** Groq model IDs available on the current API plan — cascade priority order. */
export const GROQ_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'groq/compound-mini'] as const;

/** Gemini model IDs available on the current API plan — cascade priority order. */
export const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash'] as const;

/** Nvidia NIM vision model used for image-analysis fallback. */
export const NVIDIA_VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

/** Sampling temperature for deterministic AI responses (diagnose, OCR). */
export const AI_TEMP_PRECISE = 0.1;

/** Sampling temperature for conversational AI responses (chat, lookup). */
export const AI_TEMP_CHAT = 0.2;

/** Maximum output tokens for all AI calls (must be >= 4096 for Gemini thinking models). */
export const AI_MAX_TOKENS = 4096;

/** Fetch timeout (ms) for fast providers like Groq. */
export const FAST_TIMEOUT_MS = 6_000;

/** Fetch timeout (ms) for slower providers like Gemini and Nvidia NIM. */
export const SLOW_TIMEOUT_MS = 15_000;

/** Kisan Call Centre toll-free number shown in AI fallback messages. */
export const KVK_HELPLINE = '1800-180-1551';

/** Supported UI and AI response language codes. */
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
