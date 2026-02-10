import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendViewingRequestEmail } from "@/lib/email";
import { sendWhatsApp, isMsgHubConfigured, formatPhoneNumber } from "@/lib/msghub";

export const dynamic = "force-dynamic";

// POST /api/viewings — create a viewing request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const body = await request.json();
  const { property_id, conversation_id, proposed_date, proposed_time, notes } = body;

  if (!conversation_id || !proposed_date || !proposed_time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify user is a participant
  const conv = await query(
    "SELECT id, buyer_id, seller_id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)",
    [conversation_id, userId]
  );
  if (conv.rows.length === 0) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Create viewing request
  const result = await query(
    `INSERT INTO viewing_requests (property_id, conversation_id, requester_id, proposed_date, proposed_time, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [property_id || null, conversation_id, userId, proposed_date, proposed_time, notes || null]
  );

  const viewing = result.rows[0];

  // Format date for the message
  const dateObj = new Date(proposed_date + "T00:00:00");
  const dateStr = dateObj.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  // Send a special message in the conversation
  const messageContent = JSON.stringify({
    viewing_id: viewing.id,
    date: proposed_date,
    time: proposed_time,
    date_display: dateStr,
    notes: notes || null,
    status: "pending",
  });

  await query(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES ($1, $2, $3, 'viewing_request')`,
    [conversation_id, userId, messageContent]
  );

  await query("UPDATE conversations SET last_message_at = NOW() WHERE id = $1", [conversation_id]);

  // Notify the other party
  const convData = conv.rows[0];
  const recipientId = convData.buyer_id === userId ? convData.seller_id : convData.buyer_id;
  const senderName = (session.user as { name?: string }).name || "Someone";

  await query(
    `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, 'viewing_request', $2, $3, $4)`,
    [recipientId, `${senderName} requested a viewing`, `${dateStr} at ${proposed_time}`, `/messages/${conversation_id}`]
  );

  // Send email and WhatsApp notifications to recipient
  const notifyRecipient = async () => {
    const recipientResult = await query(
      `SELECT email, name, phone, 
              COALESCE((SELECT whatsapp_enabled FROM whatsapp_settings WHERE user_id = users.id), false) as whatsapp_enabled
       FROM users WHERE id = $1`,
      [recipientId]
    );
    
    if (recipientResult.rows.length === 0) return;
    const recipient = recipientResult.rows[0];
    
    // Get property title
    let propertyTitle = "Property Viewing";
    if (property_id) {
      const propResult = await query(`SELECT title FROM properties WHERE id = $1`, [property_id]);
      if (propResult.rows.length > 0) {
        propertyTitle = propResult.rows[0].title;
      }
    }

    // Email notification
    if (recipient.email) {
      await sendViewingRequestEmail(
        recipient.email,
        recipient.name,
        senderName,
        propertyTitle,
        dateStr,
        proposed_time,
        notes || null,
        `https://nextnextpropconnect.co.za/messages/${conversation_id}`
      );
    }

    // WhatsApp notification via MsgHub
    if (isMsgHubConfigured() && recipient.whatsapp_enabled && recipient.phone) {
      const waMessage = `📅 *Viewing Request*\n\n${senderName} wants to view:\n📍 ${propertyTitle}\n📆 ${dateStr} at ${proposed_time}${notes ? `\n📝 "${notes}"` : ""}\n\n👉 Respond: https://nextnextpropconnect.co.za/messages/${conversation_id}`;
      await sendWhatsApp(formatPhoneNumber(recipient.phone), waMessage);
    }
  };

  notifyRecipient().catch((err) => {
    console.error("[Viewing] Notification failed:", err);
  });

  return NextResponse.json(viewing, { status: 201 });
}
