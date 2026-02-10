import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };
  const { id } = await params;

  // Verify ownership
  const lead = await query(
    `SELECT id FROM leads WHERE id = $1 AND agent_id = $2`,
    [parseInt(id), parseInt(user.id || "0")]
  );
  if (lead.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const result = await query(
    `SELECT * FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC`,
    [parseInt(id)]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };
  const { id } = await params;

  // Verify ownership
  const lead = await query(
    `SELECT id FROM leads WHERE id = $1 AND agent_id = $2`,
    [parseInt(id), parseInt(user.id || "0")]
  );
  if (lead.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await req.json();
  const { activity_type, description } = body;

  if (!activity_type || !description) {
    return NextResponse.json({ error: "Activity type and description are required" }, { status: 400 });
  }

  const validTypes = ["note", "call", "email", "whatsapp", "viewing", "offer", "status_change"];
  if (!validTypes.includes(activity_type)) {
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description) VALUES ($1, $2, $3) RETURNING *`,
    [parseInt(id), activity_type, description]
  );

  // Update lead's updated_at
  await query(`UPDATE leads SET updated_at = NOW() WHERE id = $1`, [parseInt(id)]);

  return NextResponse.json(result.rows[0], { status: 201 });
}
