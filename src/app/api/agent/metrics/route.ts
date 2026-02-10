import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "agent" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = parseInt(user.id || "0");
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  // Calculate real-time metrics instead of just stored snapshots
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Current listings count
  const listingsResult = await query(
    `SELECT COUNT(*)::int as count FROM properties WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  // Total views this month
  const viewsResult = await query(
    `SELECT COALESCE(SUM(views_count), 0)::int as total FROM properties WHERE user_id = $1 AND status != 'deleted'`,
    [userId]
  );

  // Total inquiries
  const inquiriesResult = await query(
    `SELECT COALESCE(SUM(inquiries_count), 0)::int as total FROM properties WHERE user_id = $1`,
    [userId]
  );

  // Messages received
  const msgsReceivedResult = await query(
    `SELECT COUNT(*)::int as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.seller_id = $1) AND m.sender_id != $1 AND m.created_at >= $2`,
    [userId, startDate]
  );

  // Messages sent
  const msgsSentResult = await query(
    `SELECT COUNT(*)::int as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id = $1 AND m.created_at >= $2`,
    [userId, startDate]
  );

  // Viewings scheduled
  const viewingsResult = await query(
    `SELECT COUNT(*)::int as count FROM viewing_requests vr
     JOIN conversations c ON vr.conversation_id = c.id
     WHERE (c.seller_id = $1) AND vr.created_at >= $2`,
    [userId, startDate]
  );

  // Lead stats
  const leadsResult = await query(
    `SELECT 
       COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE status = 'new')::int as new_count,
       COUNT(*) FILTER (WHERE status = 'contacted')::int as contacted,
       COUNT(*) FILTER (WHERE status = 'viewing_done')::int as viewing_done,
       COUNT(*) FILTER (WHERE status = 'negotiating')::int as negotiating,
       COUNT(*) FILTER (WHERE status = 'offer')::int as offer_count,
       COUNT(*) FILTER (WHERE status = 'won')::int as won,
       COUNT(*) FILTER (WHERE status = 'lost')::int as lost,
       COUNT(*) FILTER (WHERE status NOT IN ('won', 'lost'))::int as open_count
     FROM leads WHERE agent_id = $1`,
    [userId]
  );

  // Daily views data for chart (last N days)
  const dailyResult = await query(
    `SELECT * FROM agent_metrics WHERE agent_id = $1 AND date >= $2 ORDER BY date ASC`,
    [userId, startDate.toISOString().split("T")[0]]
  );

  // Avg response time (approximate from messages)
  const avgResponseResult = await query(
    `SELECT AVG(EXTRACT(EPOCH FROM (reply.created_at - orig.created_at)) / 60)::int as avg_minutes
     FROM messages orig
     JOIN conversations c ON orig.conversation_id = c.id
     JOIN messages reply ON reply.conversation_id = c.id AND reply.sender_id = $1 AND reply.created_at > orig.created_at
     WHERE c.seller_id = $1 AND orig.sender_id != $1 AND orig.created_at >= $2
     LIMIT 100`,
    [userId, startDate]
  );

  return NextResponse.json({
    listings_count: listingsResult.rows[0].count,
    total_views: viewsResult.rows[0].total,
    total_inquiries: inquiriesResult.rows[0].total,
    messages_received: msgsReceivedResult.rows[0].count,
    messages_sent: msgsSentResult.rows[0].count,
    viewings_scheduled: viewingsResult.rows[0].count,
    leads: leadsResult.rows[0],
    avg_response_minutes: avgResponseResult.rows[0]?.avg_minutes || null,
    daily: dailyResult.rows,
  });
}
