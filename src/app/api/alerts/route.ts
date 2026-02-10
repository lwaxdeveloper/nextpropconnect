import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/alerts — user's property alerts
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");

  const result = await query(
    "SELECT * FROM property_alerts WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );

  return NextResponse.json(result.rows);
}

// POST /api/alerts — create a property alert
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const body = await request.json();

  const result = await query(
    `INSERT INTO property_alerts (user_id, listing_type, property_type, min_price, max_price, bedrooms, province, city, suburb)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      userId,
      body.listing_type || null,
      body.property_type || null,
      body.min_price || null,
      body.max_price || null,
      body.bedrooms || null,
      body.province || null,
      body.city || null,
      body.suburb || null,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}

// DELETE /api/alerts — delete alert (pass id as query param)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const alertId = request.nextUrl.searchParams.get("id");

  if (!alertId) {
    return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
  }

  await query("DELETE FROM property_alerts WHERE id = $1 AND user_id = $2", [parseInt(alertId), userId]);
  return NextResponse.json({ success: true });
}

// PUT /api/alerts — toggle alert active/inactive
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const body = await request.json();
  const { id, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
  }

  const result = await query(
    "UPDATE property_alerts SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
    [is_active, id, userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
