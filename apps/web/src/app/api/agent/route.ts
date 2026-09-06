import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, language } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is missing");
      return NextResponse.json({ result: { text: "API Key not configured on the server." } }, { status: 500 });
    }

    const languageMap: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu'
    };
    
    const targetLang = languageMap[language] || 'English';

    const systemPrompt = `You are KisanSeva AI, an expert agricultural advisor for farmers in India.
Answer the following query concisely, practically, and empathetically.
Format your response in plain text with short paragraphs. 
CRITICAL: You MUST answer in ${targetLang}.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API Error:", response.status, errText);
      return NextResponse.json({ result: { text: `API Error ${response.status}: ${errText}` } }, { status: 500 });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "";
    
    if (!reply && data.choices?.[0]?.message?.reasoning) {
        reply = "I understand. I am processing your request based on agricultural best practices.";
    }

    return NextResponse.json({
      result: {
        text: reply.trim()
      }
    });

  } catch (error: any) {
    console.error("Agent API Route Error:", error);
    return NextResponse.json({ result: { text: `Server Error: ${error.message}` } }, { status: 500 });
  }
}
