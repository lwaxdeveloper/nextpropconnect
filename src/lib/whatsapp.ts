/**
 * WhatsApp Business API Integration
 * Provider: 360dialog (can be swapped for Twilio/MessageBird)
 * 
 * Setup required:
 * 1. Create 360dialog account: https://www.360dialog.com/
 * 2. Get API key and phone number ID
 * 3. Add to .env: WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER_ID
 * 4. Configure webhook URL in 360dialog dashboard
 */

import { query } from "./db";

// Types
export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., "27780193677")
  type: "text" | "template" | "image" | "document";
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: string;
      parameters: Array<{ type: string; text?: string }>;
    }>;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string };
        contacts?: Array<{ wa_id: string; profile: { name: string } }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          context?: { message_id: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Configuration
const WHATSAPP_API_URL = "https://waba.360dialog.io/v1";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

/**
 * Check if WhatsApp integration is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_API_KEY && WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Format phone number for WhatsApp (remove +, spaces, dashes)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle South African numbers
  if (cleaned.startsWith("0")) {
    cleaned = "27" + cleaned.substring(1);
  }
  
  // Ensure it starts with country code
  if (!cleaned.startsWith("27") && cleaned.length === 9) {
    cleaned = "27" + cleaned;
  }
  
  return cleaned;
}

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    console.log("[WhatsApp] Not configured, skipping send");
    return { success: false, error: "WhatsApp not configured" };
  }

  const formattedPhone = formatPhoneNumber(to);
  
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp] Send failed:", data);
      return { success: false, error: data.error?.message || "Send failed" };
    }

    console.log("[WhatsApp] Message sent:", data.messages?.[0]?.id);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error("[WhatsApp] Error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send a template message (for notifications, alerts)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp not configured" };
  }

  const formattedPhone = formatPhoneNumber(to);

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: parameters.length > 0 ? [
            {
              type: "body",
              parameters: parameters.map((text) => ({ type: "text", text })),
            },
          ] : undefined,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Template send failed" };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Queue a message for sending (with retry support)
 */
export async function queueWhatsAppMessage(
  messageId: number | null,
  recipientPhone: string,
  content: string,
  templateName?: string
): Promise<number> {
  const result = await query(
    `INSERT INTO whatsapp_queue (message_id, recipient_phone, content, template_name)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [messageId, formatPhoneNumber(recipientPhone), content, templateName || null]
  );
  return result.rows[0].id;
}

/**
 * Process the WhatsApp queue (call from cron/background job)
 */
export async function processWhatsAppQueue(): Promise<void> {
  const pending = await query(
    `SELECT * FROM whatsapp_queue 
     WHERE status = 'pending' AND attempts < 3
     ORDER BY created_at ASC LIMIT 10`
  );

  for (const item of pending.rows) {
    let result;
    
    if (item.template_name) {
      result = await sendWhatsAppTemplate(item.recipient_phone, item.template_name, []);
    } else {
      result = await sendWhatsAppMessage(item.recipient_phone, item.content);
    }

    if (result.success) {
      await query(
        `UPDATE whatsapp_queue 
         SET status = 'sent', external_id = $1, sent_at = NOW()
         WHERE id = $2`,
        [result.messageId, item.id]
      );
    } else {
      await query(
        `UPDATE whatsapp_queue 
         SET status = CASE WHEN attempts >= 2 THEN 'failed' ELSE 'pending' END,
             attempts = attempts + 1,
             error_message = $1
         WHERE id = $2`,
        [result.error, item.id]
      );
    }
  }
}

/**
 * Handle incoming WhatsApp webhook
 */
export async function handleWhatsAppWebhook(
  payload: WhatsAppWebhookPayload
): Promise<{ processed: number }> {
  let processed = 0;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      // Handle incoming messages
      if (value.messages) {
        for (const msg of value.messages) {
          if (msg.type === "text" && msg.text?.body) {
            await processIncomingMessage(
              msg.from,
              msg.text.body,
              msg.id,
              msg.context?.message_id
            );
            processed++;
          }
        }
      }

      // Handle status updates (delivered, read, etc.)
      if (value.statuses) {
        for (const status of value.statuses) {
          await updateMessageStatus(status.id, status.status);
        }
      }
    }
  }

  return { processed };
}

/**
 * Process incoming WhatsApp message and bridge to in-app conversation
 */
async function processIncomingMessage(
  fromPhone: string,
  content: string,
  externalId: string,
  replyToId?: string
): Promise<void> {
  console.log(`[WhatsApp] Incoming from ${fromPhone}: ${content.substring(0, 50)}...`);

  // Find user by phone number
  const userResult = await query(
    `SELECT id, name, role FROM users WHERE phone = $1 OR phone = $2`,
    [fromPhone, "+" + fromPhone]
  );

  if (userResult.rows.length === 0) {
    console.log(`[WhatsApp] Unknown sender: ${fromPhone}`);
    // Could send a "Please register at nextpropconnect.co.za" message
    return;
  }

  const user = userResult.rows[0];

  // Find the most recent active conversation for this user
  const convResult = await query(
    `SELECT c.id, c.buyer_id, c.seller_id 
     FROM conversations c
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND c.status = 'active'
     ORDER BY c.last_message_at DESC LIMIT 1`,
    [user.id]
  );

  if (convResult.rows.length === 0) {
    console.log(`[WhatsApp] No active conversation for user ${user.id}`);
    // Could create a support conversation or send instructions
    return;
  }

  const conversation = convResult.rows[0];

  // Insert message into conversation
  await query(
    `INSERT INTO messages (conversation_id, sender_id, content, source, external_id)
     VALUES ($1, $2, $3, 'whatsapp', $4)`,
    [conversation.id, user.id, content, externalId]
  );

  // Update conversation last_message_at
  await query(
    `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
    [conversation.id]
  );

  // Create notification for the other party
  const recipientId = conversation.buyer_id === user.id 
    ? conversation.seller_id 
    : conversation.buyer_id;

  await query(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES ($1, 'message', 'New message from ${user.name}', $2, $3)`,
    [recipientId, content.substring(0, 100), `/messages/${conversation.id}`]
  );

  console.log(`[WhatsApp] Message bridged to conversation ${conversation.id}`);
}

/**
 * Update message delivery status from WhatsApp
 */
async function updateMessageStatus(
  externalId: string,
  status: string
): Promise<void> {
  // Update the queue record
  await query(
    `UPDATE whatsapp_queue SET status = $1 WHERE external_id = $2`,
    [status, externalId]
  );
  
  // If it's a read receipt, update the message
  if (status === "read") {
    await query(
      `UPDATE messages SET is_read = TRUE WHERE external_id = $1`,
      [externalId]
    );
  }
}

/**
 * Notify user via WhatsApp when they receive an in-app message
 * Called after sending an in-app message
 */
export async function notifyViaWhatsApp(
  messageId: number,
  recipientId: number,
  senderName: string,
  messagePreview: string,
  propertyTitle?: string
): Promise<void> {
  // Check if recipient has WhatsApp enabled
  const userResult = await query(
    `SELECT phone, whatsapp_enabled FROM users WHERE id = $1`,
    [recipientId]
  );

  if (userResult.rows.length === 0) return;
  
  const user = userResult.rows[0];
  
  if (!user.whatsapp_enabled || !user.phone) {
    console.log(`[WhatsApp] User ${recipientId} has WhatsApp disabled or no phone`);
    return;
  }

  // Compose message
  let message = `📬 New message from ${senderName}`;
  if (propertyTitle) {
    message += ` about "${propertyTitle}"`;
  }
  message += `:\n\n"${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}"`;
  message += `\n\n👉 Reply here or view in app: https://nextnextpropconnect.co.za/messages`;

  // Queue for sending
  await queueWhatsAppMessage(messageId, user.phone, message);
}

/**
 * Send property alert via WhatsApp
 */
export async function sendPropertyAlert(
  userId: number,
  propertyTitle: string,
  propertyPrice: string,
  propertyUrl: string
): Promise<void> {
  const userResult = await query(
    `SELECT phone, whatsapp_enabled FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) return;
  
  const user = userResult.rows[0];
  
  if (!user.whatsapp_enabled || !user.phone) return;

  const message = `🏠 New property matching your alert!\n\n` +
    `📍 ${propertyTitle}\n` +
    `💰 ${propertyPrice}\n\n` +
    `👉 View: ${propertyUrl}`;

  await queueWhatsAppMessage(null, user.phone, message);
}
