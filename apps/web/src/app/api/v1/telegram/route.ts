import { NextRequest, NextResponse } from 'next/server';
import { callTextAI } from '@/lib/ai';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;

  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    }
  );
}

export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: 'Telegram token is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message?.text) {
      return NextResponse.json({ success: true });
    }

    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from?.first_name || 'Farmer';

    if (text === '/start') {
      await sendMessage(
        chatId,
        `Namaste ${firstName}! 🌾 I am KisanSaathi, your AI agricultural advisor.\n\nYou can ask me about:\n- Crop diseases\n- Fertilizers\n- Live Mandi prices\n- Government schemes\n\nSend me a message in English, Hindi, or Bengali!`
      );

      return NextResponse.json({ success: true });
    }

    const prompt = `You are KisanSeva Saathi, an expert agricultural advisor for farmers in India.
The farmer is talking to you on Telegram.
Keep your answer under 1000 characters and format nicely with Markdown.
If they speak in Hindi, reply in Hindi.
If Bengali, reply in Bengali.
Otherwise English.

Farmer says: "${text}"`;

    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action: 'typing',
        }),
      }
    ).catch(() => {});

    const aiResponse = await callTextAI(prompt, {
      temperature: 0.3,
    });

    const replyText =
      aiResponse.text ||
      'Sorry, I am currently facing network issues. Please try again later.';

    await sendMessage(chatId, replyText);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telegram] Webhook error:', error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Telegram webhook is active',
  });
}