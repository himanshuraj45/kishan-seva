/**
 * @file apps/web/src/app/api/v1/agent/chat/route.ts
 * @description AI agricultural advisory chat API route.
 *
 * Accepts a validated chat request and responds with farming advice from a
 * multi-provider AI cascade:
 *   1. Groq (fast, low-latency LLM)
 *   2. Gemini (Google AI fallback)
 *   3. Render ML Backend (self-hosted fallback)
 *   4. Built-in keyword knowledge base (always available, no API required)
 *
 * The route is the backend for the in-app AI Saathi chat feature.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callTextAI } from '@/lib/ai';

// ---------------------------------------------------------------------------
// Request Validation Schema
// ---------------------------------------------------------------------------

const ChatRequestSchema = z.object({
  query:    z.string().min(1, 'query is required').max(2000, 'query too long'),
  language: z.string().default('en'),
  user_id:  z.string().optional(),
  plot_id:  z.string().optional(),
  context:  z.record(z.unknown()).default({}),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the full AI system + user prompt for a given chat request.
 *
 * @param req - The validated chat request payload.
 * @returns A single combined prompt string suitable for any text LLM.
 */
function buildChatPrompt(req: ChatRequest): string {
  const currentDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long',
  });

  const system = `You are KisanSeva AI, an expert agricultural advisor for smallholder farmers in India.
Your name is "KisanSeva Saathi".
Today's date is: ${currentDate}.
Provide concise, actionable advice about crops, diseases, irrigation, fertilizers, and market prices.
You MUST reply entirely in the language corresponding to this language code: ${req.language}.
- If language is 'hi', reply in Hindi using Devanagari script.
- If language is 'bn', reply in Bengali using Bengali script.
- If language is 'en', reply in English.
Use simple vocabulary that farmers understand. Keep answers concise and practical.
Always prioritise safety — for critical diseases, advise consulting a Krishi Vigyan Kendra (KVK) expert.`;

  return `${system}\n\nUser Query: ${req.query}`;
}

/**
 * Returns a canned keyword-based advisory response when all AI providers are
 * unavailable. Covers the most common farmer queries in Hindi and English.
 *
 * @param query - The raw query string (lowercased internally).
 * @param currentDate - Formatted current date string to inject into date queries.
 * @returns A non-empty advisory string. Never throws.
 */
function getKeywordResponse(query: string, currentDate: string): string {
  const q = query.toLowerCase();
  if (q.includes('date') || q.includes('time') || q.includes('today') || q.includes('aaj'))
    return `Today is ${currentDate}.`;
  if (q.includes('wheat') || q.includes('gehu'))
    return 'Wheat Advisory: Sow Nov-Dec (rabi season). Apply 120kg N, 60kg P, 40kg K per hectare. Water 4-6 times. Watch for yellow rust — spray Propiconazole at first signs. MSP: ₹2,275/quintal.';
  if (q.includes('rice') || q.includes('paddy') || q.includes('dhan'))
    return 'Paddy Advisory: Transplant 25-30 day seedlings. Maintain 5cm water level during tillering. Apply 120-150kg N/ha in 3 splits. Watch for blast and stem borer. Harvest when 80% grains turn golden.';
  if (q.includes('tomato') || q.includes('tamatar'))
    return 'Tomato Advisory: Space 60x45cm. Stake at 30cm height. Apply NPK 19:19:19 every 15 days. Watch for early blight and leaf curl virus. Irrigate every 5-7 days. Harvest when fruits are red-orange.';
  if (q.includes('fertilizer') || q.includes('khad') || q.includes('urea') || q.includes('dap'))
    return 'Fertilizer Guide: Use Urea (46% N) for vegetative growth. Apply DAP (18N-46P) at sowing. Use MOP (60% K) during fruiting. Split urea into 3 doses to minimize losses. Ideal soil pH: 6.0-7.5.';
  if (q.includes('disease') || q.includes('rog') || q.includes('pest') || q.includes('keet'))
    return 'For disease/pest ID: Use the Crop Diagnose feature for instant AI analysis. Common treatment: Copper oxychloride for fungi, Chlorpyrifos for insects, Carbendazim for soil pathogens. Call KVK: 1800-180-1551 (free).';
  if (q.includes('price') || q.includes('mandi') || q.includes('bhav') || q.includes('rate'))
    return 'Check live mandi prices in the Market section — 500+ mandis updated daily. For MSP rates visit agmarknet.gov.in or call Kisan Call Centre: 1800-180-1551 (toll-free, 24x7).';
  if (q.includes('rain') || q.includes('weather') || q.includes('mausam') || q.includes('barish'))
    return 'Weather tip: Use the Meghdoot app or imd.gov.in for 5-day farmer-specific forecasts. Avoid sowing before predicted heavy rain. Best sowing: 3-5 clear days after last rain for proper field prep.';
  if (q.includes('loan') || q.includes('kcc') || q.includes('credit') || q.includes('subsidy'))
    return 'Kisan Credit Card (KCC): Get crop loans at 4% interest (with subvention). Apply at your nearest bank with land records. PM-KISAN gives ₹6,000/year directly to your account. Check Schemes section for all subsidies.';
  if (q.includes('irrigation') || q.includes('drip') || q.includes('pani') || q.includes('water'))
    return 'Irrigation Advisory: Drip irrigation saves 40-60% water vs flood irrigation. PM Krishi Sinchai Yojana gives 55-75% subsidy on drip systems. Check soil moisture before irrigating — insert finger 2 inches; if dry, water.';
  return `Namaste! I am KisanSeva Saathi, your AI farming advisor. I can help with:\n• 🌿 Crop disease identification (use Crop Diagnose)\n• 💧 Irrigation and fertilizer schedules\n• 📈 Live mandi prices (Market section)\n• 🏛️ Government schemes and subsidies\n• 🌤️ Weather-based crop advisory\n\nPlease ask your specific farming question!`;
}

/** Builds a standard successful chat API response object. */
function buildSuccessResponse(text: string, language: string, provider: string, confidence = 0.9) {
  return {
    agent_name: 'KisanSeva AI',
    success: true,
    result: { text, type: 'general_advisory', provider },
    confidence,
    language,
    processing_time_ms: 0,
    sources: [provider],
    follow_up_actions: [],
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/agent/chat
 *
 * Processes a farmer's query through the full 4-level AI cascade and returns
 * a structured advisory response. The cascade guarantees a response even when
 * all external APIs are offline by falling back to the keyword knowledge base.
 *
 * @param req - Next.js request with JSON body matching `ChatRequestSchema`.
 * @returns JSON advisory response or a 400 error for invalid request bodies.
 */
export async function POST(req: NextRequest) {
  const currentDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long',
  });

  try {
    const rawBody = await req.json();
    const parsed = ChatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const chatReq = parsed.data;

    // --- Attempt 1 & 2: Groq → Gemini via shared callTextAI ---
    try {
      const prompt = buildChatPrompt(chatReq);
      const { text, provider } = await callTextAI(prompt, { temperature: 0.3 });
      if (text) return NextResponse.json(buildSuccessResponse(text, chatReq.language, provider));
    } catch { /* fall through to Render ML */ }

    // --- Attempt 3: Render ML Backend ---
    const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'https://kisanseva-api.onrender.com';
    try {
      const mlResp = await fetch(`${ML_URL}/v1/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: chatReq.query,
          language: chatReq.language,
          user_id: chatReq.user_id ?? 'anonymous',
          plot_id: chatReq.plot_id,
          context: chatReq.context,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (mlResp.ok) return NextResponse.json(await mlResp.json());
    } catch { /* fall through to keyword fallback */ }

    // --- Attempt 4: Built-in keyword knowledge base (always succeeds) ---
    const fallbackText = getKeywordResponse(chatReq.query, currentDate);
    return NextResponse.json(buildSuccessResponse(fallbackText, chatReq.language, 'knowledge-base', 0.85));

  } catch (err: unknown) {
    // This catch only fires for truly unexpected errors (e.g. malformed JSON body)
    console.error('[Chat API] Unexpected error:', err);
    const fallbackText = getKeywordResponse('', currentDate);
    return NextResponse.json(buildSuccessResponse(fallbackText, 'en', 'knowledge-base', 0.8));
  }
}
