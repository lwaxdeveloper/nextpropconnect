import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; role?: string };
  const { id } = await params;

  const result = await query(
    `SELECT l.*, p.title as property_title, p.suburb, p.city, p.price as property_price, p.listing_type,
       (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as property_image
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.id = $1 AND l.agent_id = $2`,
    [parseInt(id), parseInt(user.id || "0")]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Get activities
  const activities = await query(
    `SELECT * FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC`,
    [parseInt(id)]
  );

  return NextResponse.json({ ...result.rows[0], activities: activities.rows });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; role?: string };
  const { id } = await params;

  // Verify ownership
  const existing = await query(
    `SELECT * FROM leads WHERE id = $1 AND agent_id = $2`,
    [parseInt(id), parseInt(user.id || "0")]
  );
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await req.json();
  const { contact_name, contact_email, contact_phone, property_id, source, status, priority, budget, notes, follow_up_date } = body;

  // Track status change
  const oldLead = existing.rows[0];
  if (status && status !== oldLead.status) {
    await query(
      `INSERT INTO lead_activities (lead_id, activity_type, description) VALUES ($1, 'status_change', $2)`,
      [parseInt(id), `Status changed from ${oldLead.status} to ${status}`]
    );

    // Track first response time (when moving from 'new' to any other status)
    if (oldLead.status === "new" && !oldLead.first_response_at) {
      await query(
        `UPDATE leads SET first_response_at = NOW() WHERE id = $1`,
        [parseInt(id)]
      );
    }

    // Track conversion (won)
    if (status === "won" && !oldLead.converted_at) {
      await query(
        `UPDATE leads SET converted_at = NOW() WHERE id = $1`,
        [parseInt(id)]
      );
    }

    // Track lost
    if (status === "lost" && !oldLead.lost_at) {
      await query(
        `UPDATE leads SET lost_at = NOW(), lost_reason = $1 WHERE id = $2`,
        [body.lost_reason || null, parseInt(id)]
      );
    }
  }
  if (priority && priority !== oldLead.priority) {
    await query(
      `INSERT INTO lead_activities (lead_id, activity_type, description) VALUES ($1, 'status_change', $2)`,
      [parseInt(id), `Priority changed from ${oldLead.priority} to ${priority}`]
    );
  }

  const result = await query(
    `UPDATE leads SET
      contact_name = COALESCE($1, contact_name),
      contact_email = COALESCE($2, contact_email),
      contact_phone = COALESCE($3, contact_phone),
      property_id = $4,
      source = COALESCE($5, source),
      status = COALESCE($6, status),
      priority = COALESCE($7, priority),
      budget = $8,
      notes = $9,
      follow_up_date = $10,
      updated_at = NOW()
     WHERE id = $11 AND agent_id = $12
     RETURNING *`,
    [
      contact_name || null,
      contact_email !== undefined ? contact_email : null,
      contact_phone !== undefined ? contact_phone : null,
      property_id !== undefined ? property_id : oldLead.property_id,
      source || null,
      status || null,
      priority || null,
      budget !== undefined ? budget : oldLead.budget,
      notes !== undefined ? notes : oldLead.notes,
      follow_up_date !== undefined ? follow_up_date : oldLead.follow_up_date,
      parseInt(id),
      parseInt(user.id || "0"),
    ]
  );

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; role?: string };
  const { id } = await params;

  const result = await query(
    `DELETE FROM leads WHERE id = $1 AND agent_id = $2 RETURNING id`,
    [parseInt(id), parseInt(user.id || "0")]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
