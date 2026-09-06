/**
 * @file apps/web/src/app/api/v1/soil-ocr/route.ts
 * @description Soil Health Card OCR analysis API route.
 *
 * Accepts a multipart form upload of a Soil Health Card image (or any soil
 * photo), runs it through the shared vision AI cascade, and returns a
 * structured JSON object with NPK metrics, a fertilizer schedule, and an
 * overall health score.
 */

import { NextResponse } from 'next/server';
import { callVisionAI, cleanJsonResponse, type VisionImage } from '@/lib/ai';

/** A single soil metric entry in the response. */
interface SoilMetric {
  name: string;
  value: number;
  unit: string;
  optimal_low: number;
  optimal_high: number;
  status: 'low' | 'optimal' | 'high';
  color: string;
}

/** A single fertilizer schedule action entry. */
interface ScheduleEntry {
  week: string;
  action: string;
  product: string;
  quantity: string;
  priority: 'low' | 'medium' | 'high';
}

/** The complete AI response structure for soil OCR. */
interface SoilAnalysisResult {
  metrics: SoilMetric[];
  schedule: ScheduleEntry[];
  diagnosis: string;
  tags: string[];
  overallHealth: number;
}

const SYSTEM_PROMPT = `You are an expert AI Agronomist analyzing Soil Health Cards via OCR.
Extract the soil metrics (N, P, K, pH, Organic Carbon, etc.) from the image if visible. 
If no text is visible or the image is not a soil card, make highly educated realistic estimates based on the visual soil type or return realistic Indian agricultural averages.
You must ALWAYS respond with ONLY a valid JSON object matching exactly this structure:
{
  "metrics": [
    { "name": "Nitrogen (N)", "value": 115, "unit": "kg/ha", "optimal_low": 130, "optimal_high": 150, "status": "low", "color": "#3b82f6" },
    { "name": "Phosphorus (P)", "value": 45, "unit": "kg/ha", "optimal_low": 30, "optimal_high": 50, "status": "optimal", "color": "#8b5cf6" },
    { "name": "Potassium (K)", "value": 280, "unit": "kg/ha", "optimal_low": 250, "optimal_high": 350, "status": "optimal", "color": "#f59e0b" },
    { "name": "Soil pH", "value": 6.2, "unit": "pH", "optimal_low": 6.5, "optimal_high": 7.5, "status": "low", "color": "#ec4899" },
    { "name": "Organic Carbon", "value": 0.42, "unit": "%", "optimal_low": 0.5, "optimal_high": 0.75, "status": "low", "color": "#10b981" }
  ],
  "schedule": [
    { "week": "Week 1", "action": "Action name", "product": "Fertilizer/Product", "quantity": "amount", "priority": "high" }
  ],
  "diagnosis": "A short 3 sentence diagnosis of the soil health and immediate actions required.",
  "tags": ["Low Nitrogen", "Good pH"],
  "overallHealth": 75
}
Do not wrap in markdown tags like \`\`\`json. Just return the raw JSON object matching the exact structure.`;

/**
 * POST /api/v1/soil-ocr
 *
 * Analyses an uploaded soil image or Soil Health Card via the multi-provider
 * vision AI cascade. Returns structured NPK metrics and a fertilizer schedule.
 *
 * @param req - Next.js request with `multipart/form-data` body containing
 *              an "image" field (File).
 * @returns JSON response with `{ success: true, data: SoilAnalysisResult }`
 *          or `{ success: false, error: string }` on failure.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Convert uploaded file to base64 for the AI providers
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = (image.type === 'image/jpg' ? 'image/jpeg' : image.type) || 'image/jpeg';

    const visionImage: VisionImage = { base64, mimeType };

    // Run vision AI cascade (Gemini → Nvidia NIM)
    const { text: aiText } = await callVisionAI(SYSTEM_PROMPT, visionImage);

    const parsedData: SoilAnalysisResult = JSON.parse(cleanJsonResponse(aiText));
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process soil card';
    console.error('[Soil OCR API Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
