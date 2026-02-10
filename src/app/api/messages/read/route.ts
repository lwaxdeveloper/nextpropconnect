/**
 * POST /api/messages/read
 * Mark messages as read
 * 
 * Body: { conversationId: number } - marks all unread messages in conversation
 * Or: { messageIds: number[] } - marks specific messages
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    const body = await request.json();
    const { conversationId, messageIds } = body;

    if (conversationId) {
      // Mark all messages in conversation as read (except sender's own)
      const result = await query(
        `UPDATE messages 
         SET is_read = true, read_at = NOW()
         WHERE conversation_id = $1 
           AND sender_id != $2 
           AND is_read = false
         RETURNING id`,
        [conversationId, userId]
      );

      return NextResponse.json({ 
        marked: result.rows.length,
        readAt: new Date().toISOString()
      });
    } else if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      // Mark specific messages as read
      const result = await query(
        `UPDATE messages 
         SET is_read = true, read_at = NOW()
         WHERE id = ANY($1) 
           AND sender_id != $2 
           AND is_read = false
         RETURNING id`,
        [messageIds, userId]
      );

      return NextResponse.json({ 
        marked: result.rows.length,
        readAt: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "conversationId or messageIds required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[Messages Read] Error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
