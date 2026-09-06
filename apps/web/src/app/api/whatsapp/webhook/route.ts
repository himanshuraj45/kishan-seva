import { NextResponse } from 'next/server';

// Meta requires verifying the webhook setup
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kisanseva_secure_whatsapp_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// Handle incoming WhatsApp messages from farmers
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a WhatsApp API webhook event
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from; // Farmer's phone number
        const msgBody = body.entry[0].changes[0].value.messages[0].text?.body;
        const msgType = body.entry[0].changes[0].value.messages[0].type;

        console.log(`Received WhatsApp message from ${from}: ${msgBody || msgType}`);

        // TODO: Here you would integrate with the AI Agent or process command
        // e.g., if (msgBody === 'PRICE') { sendPriceAlerts(from); }
        // e.g., if (msgType === 'image') { analyzeCropDisease(imageId); }
        
        // Let's send an automated acknowledgment for now
        await sendWhatsAppMessage(from, `KisanSeva: We received your message. Our system is processing your request.`);
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to send simple text back
async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('WhatsApp credentials missing in .env. Skipping message send.');
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
  }
}
