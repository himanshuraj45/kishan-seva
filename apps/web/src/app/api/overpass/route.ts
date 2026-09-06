import { NextRequest, NextResponse } from 'next/server';

// Multiple Overpass API mirrors for fallback
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: 'No query provided' }, { status: 400 });

  const body = 'data=' + encodeURIComponent(query);

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const resp = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20000), // 20s timeout per mirror
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      return NextResponse.json(data);
    } catch (err) {
      console.warn(`[Overpass] Mirror ${mirror} failed:`, err);
      continue;
    }
  }

  return NextResponse.json(
    { error: 'All Overpass mirrors unavailable. Please try again in a few minutes.' },
    { status: 503 }
  );
}
