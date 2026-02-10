import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendWhatsApp, isMsgHubConfigured, formatPhoneNumber } from "@/lib/msghub";
import { sendNewMessageEmail, isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/messages — paginated messages
export async function GET(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const convId = parseInt(id);

  // Verify participant
  const conv = await query(
    "SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)",
    [convId, userId]
  );
  if (conv.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const before = searchParams.get("before"); // cursor-based pagination
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  let messagesQuery: string;
  let queryParams: unknown[];

  if (before) {
    messagesQuery = `SELECT m.*, m.is_read, m.read_at, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1 AND m.id < $2
      ORDER BY m.created_at DESC LIMIT $3`;
    queryParams = [convId, parseInt(before), limit];
  } else {
    messagesQuery = `SELECT m.*, m.is_read, m.read_at, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC LIMIT $2`;
    queryParams = [convId, limit];
  }

  const result = await query(messagesQuery, queryParams);

  // Mark unread messages from the other person as read
  await query(
    `UPDATE messages SET is_read = TRUE, read_at = NOW()
     WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
    [convId, userId]
  );

  return NextResponse.json({
    messages: result.rows.reverse(), // return in chronological order
    hasMore: result.rows.length === limit,
  });
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const convId = parseInt(id);

  // Verify participant
  const conv = await query(
    "SELECT id, buyer_id, seller_id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)",
    [convId, userId]
  );
  if (conv.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content, message_type = "text" } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [convId, userId, content.trim(), message_type]
  );

  // Update conversation last_message_at
  await query(
    "UPDATE conversations SET last_message_at = NOW() WHERE id = $1",
    [convId]
  );

  // Create notification for the other person
  const convData = conv.rows[0];
  const recipientId = convData.buyer_id === userId ? convData.seller_id : convData.buyer_id;
  const senderName = (session.user as { name?: string }).name || "Someone";

  await query(
    `INSERT INTO notifications (user_id, type, title, body, link) 
     VALUES ($1, 'new_message', $2, $3, $4)`,
    [
      recipientId,
      `New message from ${senderName}`,
      content.trim().slice(0, 100),
      `/messages/${convId}`,
    ]
  );

  // Get recipient info and property title for notifications
  const recipientResult = await query(
    `SELECT u.name, u.email, u.phone, 
            COALESCE((SELECT whatsapp_enabled FROM whatsapp_settings WHERE user_id = u.id), false) as whatsapp_enabled
     FROM users u WHERE u.id = $1`,
    [recipientId]
  );
  const recipient = recipientResult.rows[0];

  const propResult = await query(
    `SELECT p.title FROM conversations c 
     LEFT JOIN properties p ON c.property_id = p.id 
     WHERE c.id = $1`,
    [convId]
  );
  const propertyTitle = propResult.rows[0]?.title;

  // Send notifications in background (don't await)
  const notifyAsync = async () => {
    // WhatsApp notification via MsgHub
    if (isMsgHubConfigured() && recipient?.whatsapp_enabled && recipient?.phone) {
      const waMessage = `📬 New message from ${senderName}${propertyTitle ? ` about "${propertyTitle}"` : ""}:\n\n"${content.trim().substring(0, 200)}${content.length > 200 ? "..." : ""}"\n\n👉 Reply: https://nextnextpropconnect.co.za/messages/${convId}`;
      await sendWhatsApp(formatPhoneNumber(recipient.phone), waMessage);
    }

    // Email notification
    if (isEmailConfigured() && recipient?.email) {
      await sendNewMessageEmail(
        recipient.email,
        recipient.name || "User",
        senderName,
        content.trim(),
        propertyTitle || null,
        `https://nextnextpropconnect.co.za/messages/${convId}`
      );
    }
  };
  notifyAsync().catch((err) => console.error("[Notify] Failed:", err));

  // Fetch sender info for the response
  const msg = result.rows[0];
  const senderResult = await query("SELECT name, avatar_url FROM users WHERE id = $1", [userId]);
  msg.sender_name = senderResult.rows[0]?.name;
  msg.sender_avatar = senderResult.rows[0]?.avatar_url;

  return NextResponse.json(msg, { status: 201 });
}
