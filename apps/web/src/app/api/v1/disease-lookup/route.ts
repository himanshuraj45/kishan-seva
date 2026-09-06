/**
 * @file apps/web/src/app/api/v1/disease-lookup/route.ts
 * @description Disease encyclopaedia lookup API route.
 *
 * Accepts a free-text search query, calls the shared text AI cascade
 * (Groq → Gemini), and returns a detailed, structured pathogen profile
 * for the closest matching agricultural disease or pest.
 */

import { NextResponse } from 'next/server';
import { callTextAI, cleanJsonResponse } from '@/lib/ai';

/** Full disease profile returned by the AI model. */
interface DiseaseProfile {
  id: string;
  name: string;
  scientific: string;
  crop: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  cause: 'Fungal' | 'Bacterial' | 'Viral' | 'Oomycete' | 'Soilborne Fungal' | 'Pest';
  affected_hosts: string;
  symptoms: string[];
  conditions: string;
  cycle: string;
  diagnosis: string;
  impact: string;
  prevention: string;
  organic: string[];
  chemical: string[];
  ipm: string;
  geography: string;
  differential: string;
}

/**
 * Builds the AI system prompt for a given search query.
 *
 * The prompt instructs the model to return a strictly typed JSON object — no
 * markdown, no prose, just the raw JSON blob.
 *
 * @param query - The farmer's free-text disease or pest search term.
 * @returns A fully assembled system prompt string.
 */
function buildDiseasePrompt(query: string): string {
  return `You are a world-class plant pathologist and agricultural database system.
The user is searching for an agricultural disease or pest using this query: "${query}".
You must synthesize a scientifically accurate, highly detailed pathogen profile for the closest matching agricultural disease.

You must ALWAYS respond with ONLY a valid JSON object matching exactly this structure:
{
  "id": "generated_id",
  "name": "Common Name of the Disease/Pest",
  "scientific": "Scientific Name",
  "crop": "Primary Affected Crop(s)",
  "severity": "Low", "Moderate", "High", or "Critical",
  "cause": "Fungal", "Bacterial", "Viral", "Oomycete", "Soilborne Fungal", or "Pest",
  "affected_hosts": "1-2 sentences on host plants.",
  "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3", "Symptom 4"],
  "conditions": "1-2 sentences on favorable weather/environmental conditions.",
  "cycle": "1-2 sentences explaining the disease lifecycle or pest lifecycle.",
  "diagnosis": "How a lab or field expert diagnoses it.",
  "impact": "Economic or yield impact.",
  "prevention": "1-2 sentences on prevention.",
  "organic": ["Organic method 1", "Organic method 2", "Organic method 3"],
  "chemical": ["Chemical treatment 1", "Chemical treatment 2"],
  "ipm": "Integrated Pest Management overarching strategy.",
  "geography": "Where it is found globally.",
  "differential": "How to differentiate it from a similar looking disease."
}
Do not wrap in markdown tags like \`\`\`json. Just return the raw JSON object.`;
}

/**
 * POST /api/v1/disease-lookup
 *
 * Searches the AI knowledge base for a crop disease or pest by free-text
 * query. Uses the shared text AI cascade (Groq → Gemini).
 *
 * @param req - Next.js request with JSON body containing `{ query: string }`.
 * @returns JSON response with `{ success: true, data: DiseaseProfile }`
 *          or `{ success: false, error: string }` on failure.
 */
export async function POST(req: Request) {
  try {
    const { query } = await req.json() as { query: string };

    if (!query?.trim()) {
      return NextResponse.json({ success: false, error: 'No search query provided' }, { status: 400 });
    }

    const prompt = buildDiseasePrompt(query);
    const { text: aiText } = await callTextAI(prompt, { temperature: 0.2 });

    const parsedData: DiseaseProfile = JSON.parse(cleanJsonResponse(aiText));
    // Ensure a stable unique ID for the frontend key prop
    parsedData.id = `ai_${Date.now()}`;

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to search disease';
    console.error('[Disease Lookup API Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
