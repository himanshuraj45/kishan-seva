/**
 * @file apps/web/src/app/api/v1/debug/route.ts
 * @description API key health-check endpoint. Returns test results for each
 * configured AI provider (Groq, Gemini). Used to verify deployment configuration.
 * @access Internal — not exposed in the public API surface.
 */
import { NextRequest, NextResponse } from 'next/server';

/** Shape of the JSON response returned by the debug endpoint. */
interface DebugResults {
  groq_key_present: boolean;
  gemini_key_present: boolean;
  groq_key_prefix: string;
  gemini_key_prefix: string;
  groq_test: string | null;
  gemini_test: string | null;
}

/**
 * GET /api/v1/debug
 *
 * Pings each configured AI provider with a minimal request and reports whether
 * each key is present and responding. Safe to call after deployment to verify
 * environment variables are correctly set in Vercel.
 *
 * @returns JSON `DebugResults` object — never throws, always returns 200.
 */
export async function GET(_req: NextRequest) {
  const GROQ_KEY = process.env.GROQ_API_KEY ?? '';
  const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';

  const results: DebugResults = {
    groq_key_present: !!GROQ_KEY,
    gemini_key_present: !!GEMINI_KEY,
    groq_key_prefix: GROQ_KEY ? `${GROQ_KEY.substring(0, 8)}...` : 'MISSING',
    gemini_key_prefix: GEMINI_KEY ? `${GEMINI_KEY.substring(0, 8)}...` : 'MISSING',
    groq_test: null,
    gemini_test: null,
  };

  if (GROQ_KEY) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'groq/compound-mini'];
    for (const model of groqModels) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 10 }),
          signal: AbortSignal.timeout(5000),
        });
        const data = await r.json();
        if (r.ok) { results.groq_test = `OK (${model})`; break; }
        else { results.groq_test = `FAIL (${model}): ${JSON.stringify(data?.error?.message)}`; }
      } catch (e: unknown) {
        results.groq_test = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  }

  if (GEMINI_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Reply with just the word: WORKING' }] }],
            generationConfig: { maxOutputTokens: 200 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = await r.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      results.gemini_test = r.ok ? `OK: "${text}"` : `FAIL: ${JSON.stringify(data?.error?.message)}`;
    } catch (e: unknown) {
      results.gemini_test = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json(results);
}
