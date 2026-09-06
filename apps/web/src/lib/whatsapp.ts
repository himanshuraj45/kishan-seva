/**
 * WhatsApp Business Cloud API Integration Service
 * Follows Meta's Graph API v19.0 specs.
 */

export interface WhatsAppTemplateParams {
  name: string;
  languageCode: string;
  components?: any[];
}

export class WhatsAppService {
  private token: string;
  private phoneNumberId: string;
  private apiUrl: string;

  constructor() {
    this.token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
  }

  isConfigured(): boolean {
    return Boolean(this.token && this.phoneNumberId);
  }

  /**
   * Send a free-form text message. 
   * Note: Only works if the user has sent a message to the business in the last 24 hours.
   */
  async sendTextMessage(to: string, text: string) {
    if (!this.isConfigured()) throw new Error('WhatsApp API not configured');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: true,
        body: text
      }
    };

    return this.post(payload);
  }

  /**
   * Send an approved template message.
   * Required for initiating conversations or sending alerts outside the 24h window.
   */
  async sendTemplateMessage(to: string, template: WhatsAppTemplateParams) {
    if (!this.isConfigured()) throw new Error('WhatsApp API not configured');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'template',
      template: {
        name: template.name,
        language: {
          code: template.languageCode
        },
        components: template.components || []
      }
    };

    return this.post(payload);
  }

  /**
   * Send an image or media file.
   */
  async sendMediaMessage(to: string, mediaUrl: string, caption?: string) {
    if (!this.isConfigured()) throw new Error('WhatsApp API not configured');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'image',
      image: {
        link: mediaUrl,
        ...(caption && { caption })
      }
    };

    return this.post(payload);
  }

  private async post(payload: any) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('WhatsApp API Error:', data);
      throw new Error(`WhatsApp API Error: ${data.error?.message || 'Unknown error'}`);
    }
    return data;
  }
}

// Export a singleton instance
export const whatsappClient = new WhatsAppService();
