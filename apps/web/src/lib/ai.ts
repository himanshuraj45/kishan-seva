/**
 * @file apps/web/src/lib/ai.ts
 * @description Shared AI provider abstraction for all KisanSeva API routes.
 *
 * This module centralises the multi-provider AI cascade so that individual
 * API routes stay lean and focused on their own domain logic.
 */
import { 
  GROQ_MODELS, 
  GEMINI_MODELS, 
  NVIDIA_VISION_MODEL,
  FAST_TIMEOUT_MS, 
  SLOW_TIMEOUT_MS,
  AI_MAX_TOKENS 
} from '@/config/constants';

export interface AIResult {
  text: string;
  provider: string;
}

interface AICallOptions {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];
  return cleaned;
}

export async function callTextAI(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResult> {
  const { temperature = 0.2, maxOutputTokens = AI_MAX_TOKENS, timeoutMs = FAST_TIMEOUT_MS } = options;

  const GROQ_KEY = process.env.GROQ_API_KEY || '';
  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

  if (GROQ_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxOutputTokens,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (resp.ok) {
          const data = await resp.json();
          const text: string = data?.choices?.[0]?.message?.content || '';
          if (text) return { text, provider: `Groq/${model}` };
        }
      } catch { /* try next */ }
    }
  }

  if (GEMINI_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature, maxOutputTokens },
            }),
            signal: AbortSignal.timeout(SLOW_TIMEOUT_MS),
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) return { text, provider: `Gemini/${model}` };
        }
      } catch { /* try next */ }
    }
  }

  throw new Error('All text AI providers failed. Please check API keys.');
}

export interface VisionImage {
  base64: string;
  mimeType: string;
}

export async function callVisionAI(
  prompt: string,
  image: VisionImage,
  options: AICallOptions = {}
): Promise<AIResult> {
  const { temperature = 0.1, maxOutputTokens = AI_MAX_TOKENS, timeoutMs = SLOW_TIMEOUT_MS } = options;

  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
  const NVIDIA_KEY = process.env.NVIDIA_NIM_KEY || '';

  if (GEMINI_KEY && GEMINI_KEY.length > 20) {
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: image.mimeType, data: image.base64 } },
                ],
              }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature,
                maxOutputTokens,
              },
            }),
            signal: AbortSignal.timeout(timeoutMs),
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) return { text, provider: `Gemini/${model}` };
        }
      } catch { /* try next */ }
    }
  }

  if (NVIDIA_KEY && !NVIDIA_KEY.startsWith('AQ.')) {
    try {
      const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVIDIA_KEY}` },
        body: JSON.stringify({
          model: NVIDIA_VISION_MODEL,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
            ],
          }],
          temperature,
          max_tokens: maxOutputTokens,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text: string = data?.choices?.[0]?.message?.content || '';
        if (text) return { text, provider: `Nvidia/${NVIDIA_VISION_MODEL}` };
      }
    } catch { /* fall through to error */ }
  }

  throw new Error('All vision AI providers failed. Please check API keys.');
}
