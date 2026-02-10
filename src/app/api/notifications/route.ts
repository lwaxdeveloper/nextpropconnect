import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/notifications — user's notifications
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get("filter"); // all, unread, messages, viewings, alerts
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  let filterCondition = "";
  if (filter === "unread") filterCondition = "AND is_read = FALSE";
  else if (filter === "messages") filterCondition = "AND type = 'new_message'";
  else if (filter === "viewings") filterCondition = "AND type IN ('viewing_request', 'viewing_confirmed')";
  else if (filter === "alerts") filterCondition = "AND type IN ('price_drop', 'new_listing')";

  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ${filterCondition} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE is_read = FALSE)::int as unread FROM notifications WHERE user_id = $1`,
    [userId]
  );

  return NextResponse.json({
    notifications: result.rows,
    total: countResult.rows[0].total,
    unread: countResult.rows[0].unread,
  });
}

// PUT /api/notifications — mark as read
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const body = await request.json();
  const { id, all } = body;

  if (all) {
    await query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE", [userId]);
  } else if (id) {
    await query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2", [id, userId]);
  }

  return NextResponse.json({ success: true });
}
