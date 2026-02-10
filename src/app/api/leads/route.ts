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

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") || "DESC";

  let sql = `
    SELECT l.*, p.title as property_title, p.suburb, p.city, p.price as property_price
    FROM leads l
    LEFT JOIN properties p ON l.property_id = p.id
    WHERE l.agent_id = $1
  `;
  const params: unknown[] = [parseInt(user.id || "0")];
  let idx = 2;

  if (status) {
    sql += ` AND l.status = $${idx}`;
    params.push(status);
    idx++;
  }
  if (priority) {
    sql += ` AND l.priority = $${idx}`;
    params.push(priority);
    idx++;
  }
  if (search) {
    sql += ` AND (l.contact_name ILIKE $${idx} OR l.contact_phone ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  const validSorts = ["created_at", "updated_at", "contact_name", "priority", "follow_up_date"];
  const sortCol = validSorts.includes(sort) ? sort : "created_at";
  const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
  sql += ` ORDER BY l.${sortCol} ${sortOrder}`;

  const result = await query(sql, params);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "agent" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { contact_name, contact_email, contact_phone, property_id, source, status, priority, budget, notes, follow_up_date } = body;

  if (!contact_name) {
    return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO leads (agent_id, contact_name, contact_email, contact_phone, property_id, source, status, priority, budget, notes, follow_up_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      parseInt(user.id || "0"),
      contact_name,
      contact_email || null,
      contact_phone || null,
      property_id || null,
      source || "nextpropconnect",
      status || "new",
      priority || "medium",
      budget || null,
      notes || null,
      follow_up_date || null,
    ]
  );

  // Log creation activity
  await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description) VALUES ($1, 'status_change', $2)`,
    [result.rows[0].id, `Lead created with status: new`]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
