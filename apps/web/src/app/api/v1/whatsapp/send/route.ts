import { NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const { to, message, templateName, languageCode } = await request.json();

    if (!to) {
      return new NextResponse(JSON.stringify({ error: 'Missing recipient number' }), { status: 400 });
    }

    if (!whatsappClient.isConfigured()) {
      // Mock mode for local testing if no .env config exists
      console.log(`[WHATSAPP MOCK] Sent to ${to}: ${message || templateName}`);
      return new NextResponse(JSON.stringify({ success: true, mock: true }), { status: 200 });
    }

    if (templateName) {
      await whatsappClient.sendTemplateMessage(to, {
        name: templateName,
        languageCode: languageCode || 'en_US',
        components: [] // Pass variables if needed
      });
    } else if (message) {
      await whatsappClient.sendTextMessage(to, message);
    } else {
      return new NextResponse(JSON.stringify({ error: 'Provide message or templateName' }), { status: 400 });
    }

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('WhatsApp Send Error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
