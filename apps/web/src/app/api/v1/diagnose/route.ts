/**
 * @file apps/web/src/app/api/v1/diagnose/route.ts
 * @description Crop disease diagnosis API route.
 *
 * Accepts a multipart form upload containing a crop leaf image, runs it
 * through the shared vision AI cascade (Gemini → Nvidia NIM → Render ML),
 * and returns a structured JSON diagnosis report.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callVisionAI, cleanJsonResponse, type VisionImage } from '@/lib/ai';

/** Expected shape of the diagnosis JSON returned by the AI model. */
interface DiagnosisAIResult {
  disease: string;
  confidence: number;
  severity: 'Low' | 'Moderate' | 'High';
  description: string;
  symptoms: string[];
  causes: string;
  prevention: string;
  treatmentSteps: string[];
}

const SYSTEM_PROMPT = `You are an expert crop agronomist and disease specialist. Analyze the provided crop leaf image.
Identify the crop and the disease, provide a confidence level (0-100), severity (Low, Moderate, High), and a short paragraph description.
Also provide exactly 3 short recommended treatment/action steps, key visual symptoms, root cause of the disease, and prevention strategies for the future.
Return ONLY valid JSON matching this schema exactly, with no markdown formatting or extra text:
{
  "disease": "string",
  "confidence": 95,
  "severity": "High",
  "description": "string",
  "symptoms": ["symptom 1", "symptom 2"],
  "causes": "string",
  "prevention": "string",
  "treatmentSteps": ["step 1", "step 2", "step 3"]
}`;

/**
 * POST /api/v1/diagnose
 *
 * Analyses an uploaded crop image for diseases using the multi-provider AI
 * cascade. Returns a structured `DiagnosisAIResult` on success.
 *
 * @param req - Next.js request containing a `multipart/form-data` body with
 *              an "image" field (File) and optional "provider" field (string).
 * @returns JSON response with `{ success: true, provider, data: DiagnosisAIResult }`
 *          or `{ success: false, error: string }` on failure.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert uploaded file to base64 for the AI providers
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = (image.type === 'image/jpg' ? 'image/jpeg' : image.type) || 'image/jpeg';

    const visionImage: VisionImage = { base64, mimeType };

    // Try vision AI cascade (Gemini → Nvidia NIM)
    let aiText: string;
    let provider: string;
    try {
      const result = await callVisionAI(SYSTEM_PROMPT, visionImage);
      aiText = result.text;
      provider = result.provider;
    } catch {
      // Final fallback: Render ML backend
      const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'https://kisanseva-api.onrender.com';
      const mlResp = await fetch(`${ML_URL}/v1/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:${mimeType};base64,${base64}` }),
        signal: AbortSignal.timeout(15000),
      });
      if (mlResp.ok) return NextResponse.json(await mlResp.json());
      throw new Error('All AI vision models failed. Please check your API keys in Vercel.');
    }

    // Parse the model response into a typed object
    const parsed: DiagnosisAIResult = JSON.parse(cleanJsonResponse(aiText));
    return NextResponse.json({ success: true, provider, data: parsed });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Diagnosis failed';
    console.error('[Diagnose API Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
