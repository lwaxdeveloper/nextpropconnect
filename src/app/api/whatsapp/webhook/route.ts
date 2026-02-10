/**
 * WhatsApp Webhook Endpoint
 * 
 * Receives incoming messages from MsgHub (forwarded from Meta WhatsApp API)
 * 
 * MsgHub forwards format:
 * {
 *   "event": "message.received",
 *   "timestamp": "2026-02-09T15:30:00Z",
 *   "data": {
 *     "id": "uuid",
 *     "channel": "whatsapp",
 *     "from": "27780193677",
 *     "content": "Hello",
 *     "type": "text",
 *     "externalId": "wamid.xxx"
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendWhatsAppLeadEmail } from "@/lib/email";

// Types for MsgHub webhook payload
interface MsgHubWebhookPayload {
  event: string;
  timestamp: string;
  data: {
    id: string;
    channel: string;
    from: string;
    content: string;
    type: string;
    externalId: string;
  };
}

// Legacy WhatsApp direct webhook payload (keep for compatibility)
interface WhatsAppWebhookPayload {
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
        }>;
      };
      field: string;
    }>;
  }>;
}

const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || "nextpropconnect_verify_2026";

/**
 * GET - Webhook verification (for Meta/MsgHub verification)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("[WhatsApp Webhook] Verification request:", { mode, token });

  if (mode === "subscribe" && token === WEBHOOK_SECRET) {
    console.log("[WhatsApp Webhook] Verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[WhatsApp Webhook] Verification failed");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST - Receive incoming messages from MsgHub or direct WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Check headers to determine source
    const msgHubEvent = request.headers.get("X-MsgHub-Event");
    
    console.log("[WhatsApp Webhook] Received:", JSON.stringify(payload, null, 2));

    if (msgHubEvent === "message.received") {
      // MsgHub format
      const result = await handleMsgHubMessage(payload as MsgHubWebhookPayload);
      return NextResponse.json({ status: "ok", ...result });
    } else if (payload.object === "whatsapp_business_account") {
      // Direct WhatsApp/Meta format (legacy)
      const result = await handleDirectWhatsApp(payload as WhatsAppWebhookPayload);
      return NextResponse.json({ status: "ok", ...result });
    } else {
      console.log("[WhatsApp Webhook] Unknown payload format");
      return NextResponse.json({ status: "ok", message: "Unknown format" });
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    // Always return 200 to prevent retries
    return NextResponse.json({ status: "error", message: String(error) });
  }
}

/**
 * Handle messages from MsgHub
 */
async function handleMsgHubMessage(payload: MsgHubWebhookPayload): Promise<{ processed: number; conversationId?: number }> {
  const { data } = payload;
  
  if (!data || !data.from || !data.content) {
    console.log("[WhatsApp Webhook] Missing required fields in MsgHub payload");
    return { processed: 0 };
  }

  const phoneNumber = normalizePhone(data.from);
  
  console.log(`[WhatsApp Webhook] Processing message from ${phoneNumber}: ${data.content.substring(0, 50)}...`);

  // Find or create WhatsApp conversation (pass message to extract property/agent)
  let conversation = await findOrCreateConversation(phoneNumber, data.content);
  
  // Check for duplicate (by external_id)
  if (data.externalId) {
    const existing = await query(
      `SELECT id FROM whatsapp_messages WHERE external_id = $1`,
      [data.externalId]
    );
    if (existing.rows.length > 0) {
      console.log(`[WhatsApp Webhook] Duplicate message ${data.externalId}, skipping`);
      return { processed: 0, conversationId: conversation.id };
    }
  }

  // Insert the message
  await query(
    `INSERT INTO whatsapp_messages 
     (conversation_id, sender_phone, content, direction, external_id, status)
     VALUES ($1, $2, $3, 'inbound', $4, 'received')`,
    [conversation.id, phoneNumber, data.content, data.externalId || data.id]
  );

  // Update conversation timestamp
  await query(
    `UPDATE whatsapp_conversations SET updated_at = NOW() WHERE id = $1`,
    [conversation.id]
  );

  // Create notification for the agent (if assigned)
  if (conversation.agent_id) {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link, created_at)
       VALUES ($1, 'whatsapp', 'New WhatsApp message', $2, $3, NOW())`,
      [
        conversation.agent_id,
        `From ${phoneNumber}: ${data.content.substring(0, 100)}`,
        `/agent/conversations/${conversation.id}`
      ]
    );

    // Send WhatsApp notification to agent's personal number
    await notifyAgentViaWhatsApp(
      conversation.agent_id,
      phoneNumber,
      data.content,
      conversation.property_id,
      conversation.id
    );

    // Also send email notification
    await notifyAgentViaEmail(
      conversation.agent_id,
      phoneNumber,
      data.content,
      conversation.property_id,
      conversation.id
    );
  }

  console.log(`[WhatsApp Webhook] Message stored in conversation ${conversation.id}`);
  
  return { processed: 1, conversationId: conversation.id };
}

/**
 * Handle direct WhatsApp webhook (legacy/fallback)
 */
async function handleDirectWhatsApp(payload: WhatsAppWebhookPayload): Promise<{ processed: number }> {
  let processed = 0;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      if (value.messages) {
        for (const msg of value.messages) {
          if (msg.type === "text" && msg.text?.body) {
            await handleMsgHubMessage({
              event: "message.received",
              timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
              data: {
                id: msg.id,
                channel: "whatsapp",
                from: msg.from,
                content: msg.text.body,
                type: "text",
                externalId: msg.id
              }
            });
            processed++;
          }
        }
      }
    }
  }

  return { processed };
}

/**
 * Find existing conversation or create a new one
 * Parses message content to extract property ID and assign to correct agent
 */
async function findOrCreateConversation(phoneNumber: string, messageContent?: string): Promise<{ id: number; agent_id: number | null; property_id: number | null }> {
  // Look for existing active conversation
  const existing = await query(
    `SELECT id, agent_id, property_id FROM whatsapp_conversations 
     WHERE phone_number = $1 AND status = 'active'
     ORDER BY updated_at DESC LIMIT 1`,
    [phoneNumber]
  );

  if (existing.rows.length > 0) {
    // If existing conversation has no agent but message mentions a property, update it
    if (!existing.rows[0].agent_id && messageContent) {
      const propertyId = extractPropertyId(messageContent);
      if (propertyId) {
        const agentId = await getAgentForProperty(propertyId);
        if (agentId) {
          await query(
            `UPDATE whatsapp_conversations SET agent_id = $1, property_id = $2 WHERE id = $3`,
            [agentId, propertyId, existing.rows[0].id]
          );
          existing.rows[0].agent_id = agentId;
          existing.rows[0].property_id = propertyId;
          console.log(`[WhatsApp Webhook] Updated conversation ${existing.rows[0].id} with agent ${agentId}`);
        }
      }
    }
    return existing.rows[0];
  }

  // Extract property ID from message (e.g., "nextnextpropconnect.co.za/properties/123")
  let propertyId: number | null = null;
  let agentId: number | null = null;

  if (messageContent) {
    propertyId = extractPropertyId(messageContent);
    if (propertyId) {
      agentId = await getAgentForProperty(propertyId);
      console.log(`[WhatsApp Webhook] Extracted property ${propertyId}, agent ${agentId} from message`);
    }
  }

  // Try to find a user with this phone number
  const userResult = await query(
    `SELECT u.id FROM users u 
     WHERE u.phone = $1 OR u.phone = $2
     LIMIT 1`,
    [phoneNumber, "+" + phoneNumber]
  );

  // If no agent from property, try to find from leads
  if (!agentId) {
    const leadResult = await query(
      `SELECT agent_id FROM leads 
       WHERE contact_phone = $1 OR contact_phone = $2
       ORDER BY created_at DESC LIMIT 1`,
      [phoneNumber, "+" + phoneNumber]
    );
    agentId = leadResult.rows[0]?.agent_id || null;
  }

  const userId = userResult.rows[0]?.id || null;

  // Create new conversation
  const newConv = await query(
    `INSERT INTO whatsapp_conversations 
     (phone_number, user_id, agent_id, property_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
     RETURNING id, agent_id, property_id`,
    [phoneNumber, userId, agentId, propertyId]
  );

  console.log(`[WhatsApp Webhook] Created conversation ${newConv.rows[0].id} for ${phoneNumber} → agent ${agentId}, property ${propertyId}`);
  
  return newConv.rows[0];
}

/**
 * Extract property ID from message content
 * Looks for patterns like "/properties/123" or "nextnextpropconnect.co.za/properties/123"
 */
function extractPropertyId(content: string): number | null {
  // Match /properties/123 or properties/123
  const match = content.match(/\/properties\/(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Get the agent responsible for a property
 */
async function getAgentForProperty(propertyId: number): Promise<number | null> {
  // First check if property has a direct agent
  const agentResult = await query(
    `SELECT ap.user_id 
     FROM properties p
     JOIN agent_profiles ap ON ap.id = p.agent_id
     WHERE p.id = $1`,
    [propertyId]
  );
  
  if (agentResult.rows.length > 0) {
    return agentResult.rows[0].user_id;
  }

  // If no agent, check if it's listed by an owner (user_id)
  const ownerResult = await query(
    `SELECT user_id FROM properties WHERE id = $1`,
    [propertyId]
  );
  
  if (ownerResult.rows.length > 0) {
    return ownerResult.rows[0].user_id;
  }

  return null;
}

/**
 * Normalize phone number (remove +, ensure country code)
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle SA numbers starting with 0
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "27" + cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Send Email notification to agent about new WhatsApp inquiry
 */
async function notifyAgentViaEmail(
  agentUserId: number,
  customerPhone: string,
  messageContent: string,
  propertyId: number | null,
  conversationId: number
): Promise<void> {
  try {
    // Get agent's email
    const agentResult = await query(
      `SELECT email, name FROM users WHERE id = $1`,
      [agentUserId]
    );

    if (agentResult.rows.length === 0 || !agentResult.rows[0].email) {
      console.log(`[Email Notify] Agent ${agentUserId} has no email`);
      return;
    }

    const agentEmail = agentResult.rows[0].email;
    const agentName = agentResult.rows[0].name;

    // Get property title if available
    let propertyTitle: string | null = null;
    if (propertyId) {
      const propResult = await query(
        `SELECT title FROM properties WHERE id = $1`,
        [propertyId]
      );
      propertyTitle = propResult.rows[0]?.title || null;
    }

    const conversationUrl = `https://nextnextpropconnect.co.za/agent/conversations/${conversationId}`;

    await sendWhatsAppLeadEmail(
      agentEmail,
      agentName,
      customerPhone,
      messageContent,
      propertyTitle,
      conversationUrl
    );
  } catch (error) {
    console.error(`[Email Notify] Error:`, error);
  }
}

/**
 * Send WhatsApp notification to agent's personal number about new inquiry
 */
async function notifyAgentViaWhatsApp(
  agentUserId: number,
  customerPhone: string,
  messageContent: string,
  propertyId: number | null,
  conversationId: number
): Promise<void> {
  try {
    // Get agent's phone number
    const agentResult = await query(
      `SELECT phone, name FROM users WHERE id = $1`,
      [agentUserId]
    );

    if (agentResult.rows.length === 0 || !agentResult.rows[0].phone) {
      console.log(`[WhatsApp Notify] Agent ${agentUserId} has no phone number`);
      return;
    }

    const agentPhone = normalizePhone(agentResult.rows[0].phone);
    const agentName = agentResult.rows[0].name;

    // Don't send notification to the same number (avoid loop)
    if (agentPhone === customerPhone) {
      console.log(`[WhatsApp Notify] Skipping - agent phone same as customer`);
      return;
    }

    // Get property title if available
    let propertyTitle = "";
    if (propertyId) {
      const propResult = await query(
        `SELECT title FROM properties WHERE id = $1`,
        [propertyId]
      );
      propertyTitle = propResult.rows[0]?.title || "";
    }

    // Compose notification message
    const messagePreview = messageContent.length > 150 
      ? messageContent.substring(0, 150) + "..." 
      : messageContent;

    const notificationText = 
      `🔔 *New NextPropConnect Lead!*\n\n` +
      `📱 From: +${customerPhone}\n` +
      (propertyTitle ? `🏠 Property: ${propertyTitle}\n` : "") +
      `\n💬 Message:\n"${messagePreview}"\n\n` +
      `👉 Reply here: https://nextnextpropconnect.co.za/agent/conversations/${conversationId}`;

    // Send via MsgHub API
    const MSGHUB_URL = process.env.MSGHUB_URL || "https://messaging.itedia.co.za";
    const MSGHUB_API_KEY = process.env.MSGHUB_API_KEY || "";

    const response = await fetch(`${MSGHUB_URL}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MSGHUB_API_KEY
      },
      body: JSON.stringify({
        channel: "WHATSAPP",
        to: agentPhone,
        content: notificationText
      })
    });

    if (response.ok) {
      console.log(`[WhatsApp Notify] Sent notification to agent ${agentName} (${agentPhone})`);
    } else {
      const error = await response.text();
      console.error(`[WhatsApp Notify] Failed to notify agent:`, error);
    }
  } catch (error) {
    console.error(`[WhatsApp Notify] Error:`, error);
    // Don't throw - notification failure shouldn't break the webhook
  }
}
