import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang');

  if (!text || !lang) {
    return new NextResponse('Missing text or lang', { status: 400 });
  }

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    
    if (!response.ok) {
      console.error(`Google TTS failed: ${response.status} ${response.statusText}`);
      return new NextResponse('Error generating audio from upstream', { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('TTS Proxy Error:', error);
    return new NextResponse('Error generating audio', { status: 500 });
  }
}

