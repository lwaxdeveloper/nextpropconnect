import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// PUT /api/viewings/[id] — update viewing status
export async function PUT(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const viewingId = parseInt(id);
  const body = await request.json();
  const { status } = body;

  if (!["confirmed", "declined", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Get viewing and verify the user is part of the conversation
  const viewing = await query(
    `SELECT vr.*, c.buyer_id, c.seller_id, c.id as conv_id
     FROM viewing_requests vr
     JOIN conversations c ON vr.conversation_id = c.id
     WHERE vr.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
    [viewingId, userId]
  );

  if (viewing.rows.length === 0) {
    return NextResponse.json({ error: "Viewing not found" }, { status: 404 });
  }

  const vr = viewing.rows[0];

  // Update the viewing status
  await query("UPDATE viewing_requests SET status = $1 WHERE id = $2", [status, viewingId]);

  // Send a system message about the status change
  const dateObj = new Date(vr.proposed_date);
  const dateStr = dateObj.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  const messageContent = JSON.stringify({
    viewing_id: viewingId,
    date: vr.proposed_date,
    time: vr.proposed_time,
    date_display: dateStr,
    status: status,
  });

  await query(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES ($1, $2, $3, 'viewing_request')`,
    [vr.conv_id, userId, messageContent]
  );

  await query("UPDATE conversations SET last_message_at = NOW() WHERE id = $1", [vr.conv_id]);

  // Notify the other party
  const recipientId = vr.buyer_id === userId ? vr.seller_id : vr.buyer_id;
  const senderName = (session.user as { name?: string }).name || "Someone";
  const notifType = status === "confirmed" ? "viewing_confirmed" : "viewing_request";
  const statusEmoji = status === "confirmed" ? "✅" : status === "declined" ? "❌" : "🚫";

  await query(
    `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5)`,
    [recipientId, notifType, `${statusEmoji} Viewing ${status}`, `${senderName} ${status} the viewing on ${dateStr} at ${vr.proposed_time}`, `/messages/${vr.conv_id}`]
  );

  return NextResponse.json({ success: true, status });
}
