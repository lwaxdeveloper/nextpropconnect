/**
 * MsgHub Client for NextPropConnect
 * Handles sending messages through the centralized messaging service
 */

const MSGHUB_URL = process.env.MSGHUB_URL || 'https://messaging.itedia.co.za';
const MSGHUB_API_KEY = process.env.MSGHUB_API_KEY || '';
const MSGHUB_TENANT_ID = process.env.MSGHUB_TENANT_ID || '';

export interface SendMessageParams {
  to: string;           // Phone number (e.g., "27780193677")
  message: string;      // Text message content
  channel?: 'WHATSAPP' | 'TELEGRAM';
}

export interface MsgHubMessage {
  id: string;
  channel: string;
  direction: 'INBOUND' | 'OUTBOUND';
  recipient: string;
  senderId: string;
  content: string;
  status: string;
  createdAt: string;
}

/**
 * Send a message through MsgHub
 */
export async function sendMessage({ to, message, channel = 'WHATSAPP' }: SendMessageParams): Promise<MsgHubMessage | null> {
  if (!MSGHUB_API_KEY || !MSGHUB_TENANT_ID) {
    console.error('MsgHub not configured: missing API key or tenant ID');
    return null;
  }

  try {
    const response = await fetch(`${MSGHUB_URL}/api/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MSGHUB_API_KEY,
        'X-Tenant-ID': MSGHUB_TENANT_ID,
      },
      body: JSON.stringify({
        channel,
        recipient: to,
        content: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MsgHub send failed:', response.status, error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('MsgHub send error:', error);
    return null;
  }
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsApp(to: string, message: string): Promise<MsgHubMessage | null> {
  return sendMessage({ to, message, channel: 'WHATSAPP' });
}

/**
 * Format phone number for WhatsApp (remove + and spaces)
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[\s+\-()]/g, '');
}

/**
 * Check if MsgHub is configured
 */
export function isMsgHubConfigured(): boolean {
  return Boolean(MSGHUB_API_KEY && MSGHUB_TENANT_ID);
}
