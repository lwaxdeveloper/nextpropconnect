/**
 * WhatsApp Conversation Detail API
 * 
 * GET /api/agent/whatsapp/[id] - Get messages for a conversation
 * POST /api/agent/whatsapp/[id] - Send a reply via MsgHub
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

const MSGHUB_URL = process.env.MSGHUB_URL || "https://messaging.itedia.co.za";
const MSGHUB_API_KEY = process.env.MSGHUB_API_KEY || "";

/**
 * GET - Fetch messages for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = parseInt(id);

  try {
    // Get conversation details
    const convResult = await query(
      `SELECT wc.*, u.name as user_name, p.title as property_title
       FROM whatsapp_conversations wc
       LEFT JOIN users u ON u.id = wc.user_id
       LEFT JOIN properties p ON p.id = wc.property_id
       WHERE wc.id = $1`,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conversation = convResult.rows[0];

    // Get messages
    const messages = await query(
      `SELECT id, sender_phone, sender_id, content, direction, status, created_at
       FROM whatsapp_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        phoneNumber: conversation.phone_number,
        userName: conversation.user_name || `+${conversation.phone_number}`,
        propertyTitle: conversation.property_title,
        status: conversation.status,
        createdAt: conversation.created_at
      },
      messages: messages.rows.map(m => ({
        id: m.id,
        content: m.content,
        direction: m.direction, // 'inbound' or 'outbound'
        status: m.status,
        createdAt: m.created_at,
        isFromCustomer: m.direction === 'inbound'
      }))
    });
  } catch (error) {
    console.error("[WhatsApp API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * POST - Send a reply to the conversation via MsgHub
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = parseInt(id);
  const userId = parseInt(session.user.id as string);

  try {
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Get conversation to find phone number
    const convResult = await query(
      `SELECT phone_number FROM whatsapp_conversations WHERE id = $1`,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const phoneNumber = convResult.rows[0].phone_number;

    // Send via MsgHub
    const msgHubResponse = await fetch(`${MSGHUB_URL}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MSGHUB_API_KEY
      },
      body: JSON.stringify({
        channel: "WHATSAPP",
        to: phoneNumber,
        content: content.trim()
      })
    });

    const msgHubResult = await msgHubResponse.json();

    if (!msgHubResponse.ok) {
      console.error("[WhatsApp API] MsgHub error:", msgHubResult);
      return NextResponse.json({ 
        error: msgHubResult.error || "Failed to send message" 
      }, { status: 500 });
    }

    // Store the outbound message in our DB
    const insertResult = await query(
      `INSERT INTO whatsapp_messages 
       (conversation_id, sender_id, content, direction, external_id, status, created_at)
       VALUES ($1, $2, $3, 'outbound', $4, 'sent', NOW())
       RETURNING id, created_at`,
      [conversationId, userId, content.trim(), msgHubResult.externalId || msgHubResult.id]
    );

    // Update conversation timestamp
    await query(
      `UPDATE whatsapp_conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    return NextResponse.json({
      success: true,
      message: {
        id: insertResult.rows[0].id,
        content: content.trim(),
        direction: 'outbound',
        status: 'sent',
        createdAt: insertResult.rows[0].created_at,
        isFromCustomer: false
      }
    });

  } catch (error) {
    console.error("[WhatsApp API] Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
