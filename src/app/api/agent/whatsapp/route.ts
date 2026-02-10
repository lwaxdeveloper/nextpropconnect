/**
 * WhatsApp Conversations API for Agents
 * 
 * GET /api/agent/whatsapp - List agent's WhatsApp conversations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string);

  try {
    // Check if user is admin (sees all) or agent (sees their own + unassigned)
    const userResult = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
    const isAdmin = userResult.rows[0]?.role === 'admin';

    // Get conversations for this agent (or all if admin)
    const conversations = await query(
      `SELECT 
        wc.id,
        wc.phone_number,
        wc.user_id,
        wc.property_id,
        wc.agent_id,
        wc.status,
        wc.created_at,
        wc.updated_at,
        u.name as user_name,
        p.title as property_title,
        agent_user.name as agent_name,
        (SELECT COUNT(*) FROM whatsapp_messages wm WHERE wm.conversation_id = wc.id) as message_count,
        (SELECT content FROM whatsapp_messages wm WHERE wm.conversation_id = wc.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM whatsapp_messages wm WHERE wm.conversation_id = wc.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM whatsapp_conversations wc
      LEFT JOIN users u ON u.id = wc.user_id
      LEFT JOIN properties p ON p.id = wc.property_id
      LEFT JOIN users agent_user ON agent_user.id = wc.agent_id
      WHERE wc.agent_id = $1 OR wc.agent_id IS NULL ${isAdmin ? 'OR 1=1' : ''}
      ORDER BY wc.updated_at DESC
      LIMIT 50`,
      [userId]
    );

    return NextResponse.json({
      conversations: conversations.rows.map(c => ({
        id: c.id,
        phoneNumber: c.phone_number,
        userName: c.user_name || `+${c.phone_number}`,
        propertyTitle: c.property_title,
        agentName: c.agent_name,
        agentId: c.agent_id,
        isAssignedToMe: c.agent_id === userId,
        status: c.status,
        messageCount: parseInt(c.message_count) || 0,
        lastMessage: c.last_message,
        lastMessageAt: c.last_message_at,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (error) {
    console.error("[WhatsApp API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
