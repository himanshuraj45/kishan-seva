import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const language = (formData.get('language') as string) || 'en';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    // Map our language codes to Whisper language codes
    const langMap: Record<string, string> = {
      en: 'en',
      hi: 'hi',
      bn: 'bn',
      ta: 'ta',
      te: 'te',
    };
    const whisperLang = langMap[language] || 'en';

    // Forward to Groq Whisper API
    const groqForm = new FormData();
    groqForm.append('file', audioFile, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3');
    groqForm.append('language', whisperLang);
    groqForm.append('response_format', 'json');

    const groqResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: groqForm,
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text();
      console.error('[Transcribe] Groq error:', errText);
      return NextResponse.json({ error: 'Transcription failed', detail: errText }, { status: 502 });
    }

    const result = await groqResp.json();
    return NextResponse.json({ text: result.text?.trim() || '' });
  } catch (err: any) {
    console.error('[Transcribe] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
