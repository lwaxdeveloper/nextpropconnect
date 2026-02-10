/**
 * MsgHub Webhook Handler
 * Receives incoming messages forwarded from MsgHub
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MSGHUB_WEBHOOK_SECRET = process.env.MSGHUB_WEBHOOK_SECRET || '';

interface MsgHubWebhookPayload {
  id: string;
  tenantId: string;
  channel: 'WHATSAPP' | 'TELEGRAM';
  direction: 'INBOUND' | 'OUTBOUND';
  recipient: string;
  senderId: string;
  content: string;
  externalId: string;
  status: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook - check for MsgHub signature header
    // MsgHub sends X-MsgHub-Signature with HMAC-SHA256
    const signature = request.headers.get('X-MsgHub-Signature');
    const tenantId = request.headers.get('X-MsgHub-Tenant');
    
    // For now, verify by checking tenant ID matches our expected tenant
    const expectedTenantId = process.env.MSGHUB_TENANT_ID;
    if (expectedTenantId && tenantId !== expectedTenantId) {
      console.warn('Invalid tenant ID:', tenantId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('MsgHub webhook authenticated, signature:', signature?.substring(0, 20) + '...');

    const payload: MsgHubWebhookPayload = await request.json();
    console.log('MsgHub webhook received:', JSON.stringify(payload, null, 2));

    // Only process inbound messages
    if (payload.direction !== 'INBOUND') {
      return NextResponse.json({ status: 'ignored', reason: 'not inbound' });
    }

    const phoneNumber = payload.senderId;
    const formattedPhone = phoneNumber.startsWith('27') 
      ? '0' + phoneNumber.slice(2) 
      : phoneNumber;

    // Try to find user by phone number
    const userResult = await query(
      `SELECT id FROM users WHERE phone IN ($1, $2, $3) LIMIT 1`,
      [phoneNumber, formattedPhone, '+' + phoneNumber]
    );
    const userId = userResult.rows[0]?.id || null;

    // Find existing conversation or create new one
    let conversationResult = await query(
      `SELECT id FROM whatsapp_conversations 
       WHERE phone_number IN ($1, $2) 
       ORDER BY updated_at DESC LIMIT 1`,
      [phoneNumber, formattedPhone]
    );

    let conversationId: string;
    
    if (conversationResult.rows.length === 0) {
      // Create new conversation
      const newConversation = await query(
        `INSERT INTO whatsapp_conversations (phone_number, user_id, status, created_at, updated_at)
         VALUES ($1, $2, 'active', NOW(), NOW())
         RETURNING id`,
        [phoneNumber, userId]
      );
      conversationId = newConversation.rows[0].id;
    } else {
      conversationId = conversationResult.rows[0].id;
    }

    // Store the message
    const messageResult = await query(
      `INSERT INTO whatsapp_messages 
       (conversation_id, sender_phone, content, direction, external_id, status, created_at)
       VALUES ($1, $2, $3, 'inbound', $4, 'delivered', NOW())
       RETURNING id`,
      [conversationId, phoneNumber, payload.content, payload.externalId]
    );

    // Update conversation timestamp
    await query(
      `UPDATE whatsapp_conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    console.log(`Stored WhatsApp message: ${messageResult.rows[0].id} in conversation ${conversationId}`);

    return NextResponse.json({ 
      status: 'ok',
      messageId: messageResult.rows[0].id,
      conversationId,
    });

  } catch (error) {
    console.error('MsgHub webhook error:', error);
    return NextResponse.json({ status: 'error', error: String(error) });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'nextpropconnect-msghub-webhook' });
}
