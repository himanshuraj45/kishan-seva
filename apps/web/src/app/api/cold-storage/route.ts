import { NextRequest, NextResponse } from 'next/server';

// ── Helpers ──────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Gemini AI cold storage search ────────────────────────────
async function fetchFromGemini(lat: number, lon: number, cityName: string, radiusKm: number) {
  const prompt = `You are a database of cold storage facilities in India. 
The user is at coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)} near ${cityName}.
List 8–12 real cold storage facilities within ${radiusKm} km of this location.
These can include government-run, private, co-operative, or NAFED facilities.

Return ONLY a valid JSON array. Each item must have:
- name (string): Full name of the facility
- address (string): Street/village, district, state
- lat (number): Approximate latitude
- lon (number): Approximate longitude
- phone (string|null): Phone number if known
- operator (string|null): Who operates it (e.g. "NAFED", "State Government", "Private")
- capacity (string|null): Storage capacity if known

Example format:
[{"name":"Punjab State Cold Storage","address":"GT Road, Ludhiana, Punjab","lat":30.905,"lon":75.861,"phone":"+91 161 2770001","operator":"Punjab Agro","capacity":"5000 MT"}]

Return only the JSON array, no explanation text.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
      }),
      signal: AbortSignal.timeout(18000),
    }
  );
  if (!res.ok) throw new Error('Gemini API error: ' + res.status);
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Gemini returned no JSON array');
  return JSON.parse(match[0]) as any[];
}

// ── Groq AI cold storage search (fallback) ───────────────────
async function fetchFromGroq(lat: number, lon: number, cityName: string, radiusKm: number) {
  const prompt = `You are a database of cold storage facilities in India. 
The user is near ${cityName} (${lat.toFixed(4)}, ${lon.toFixed(4)}).
List 8 real cold storage facilities within ${radiusKm} km. Include government, NAFED, private facilities.
Return ONLY a JSON array with objects: name, address, lat, lon, phone (or null), operator (or null), capacity (or null).
Return only the JSON array, no other text.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('Groq API error: ' + res.status);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content || '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Groq returned no JSON array');
  return JSON.parse(match[0]) as any[];
}

// ── Parse AI results into ColdStorage format ─────────────────
function parseAIResults(items: any[], lat: number, lon: number) {
  return items
    .filter((item) => item.name && item.lat && item.lon)
    .map((item, i) => ({
      id: 'ai_' + i,
      name: item.name,
      address: item.address || '',
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      distanceKm: haversineKm(lat, lon, parseFloat(item.lat), parseFloat(item.lon)),
      phone: item.phone || undefined,
      operator: item.operator || undefined,
      capacity: item.capacity || undefined,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + item.address)}`,
      aiGenerated: true,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Route Handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { lat, lon, city, radiusKm = 50 } = await req.json();
    if (!lat || !lon) return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });

    const cityName = city || 'your location';

    // Try Gemini first
    try {
      const items = await fetchFromGemini(lat, lon, cityName, radiusKm);
      const results = parseAIResults(items, lat, lon);
      return NextResponse.json({ results, source: 'gemini', isFallback: true });
    } catch (geminiErr) {
      console.warn('[cold-storage] Gemini failed, trying Groq:', geminiErr);
    }

    // Fallback: Groq
    try {
      const items = await fetchFromGroq(lat, lon, cityName, radiusKm);
      const results = parseAIResults(items, lat, lon);
      return NextResponse.json({ results, source: 'groq', isFallback: true });
    } catch (groqErr) {
      console.warn('[cold-storage] Groq also failed:', groqErr);
    }

    return NextResponse.json({ error: 'All AI providers failed' }, { status: 503 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
