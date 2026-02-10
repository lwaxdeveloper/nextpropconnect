import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Get user + agent profile
  const userResult = await query(`SELECT id, name, email, phone, avatar_url, role FROM users WHERE id = $1`, [userId]);
  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profileResult = await query(`SELECT * FROM agent_profiles WHERE user_id = $1`, [userId]);
  const profile = profileResult.rows[0] || null;

  return NextResponse.json({
    user: userResult.rows[0],
    profile,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  const body = await req.json();
  const { name, phone, bio, areas_served, specializations, commission_rate, eaab_number, ffc_number, show_phone, enable_whatsapp, avatar_url } = body;

  // Update user table
  if (name || phone !== undefined || avatar_url !== undefined) {
    await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4`,
      [name || null, phone !== undefined ? phone : null, avatar_url !== undefined ? avatar_url : null, userId]
    );
  }

  // Upsert agent profile
  const existing = await query(`SELECT id FROM agent_profiles WHERE user_id = $1`, [userId]);

  if (existing.rows.length > 0) {
    await query(
      `UPDATE agent_profiles SET
        bio = COALESCE($1, bio),
        areas_served = COALESCE($2, areas_served),
        specializations = COALESCE($3, specializations),
        commission_rate = $4,
        eaab_number = $5,
        ffc_number = $6,
        show_phone = COALESCE($7, show_phone),
        enable_whatsapp = COALESCE($8, enable_whatsapp),
        updated_at = NOW()
       WHERE user_id = $9`,
      [
        bio || null,
        areas_served || null,
        specializations || null,
        commission_rate !== undefined ? commission_rate : null,
        eaab_number !== undefined ? eaab_number : null,
        ffc_number !== undefined ? ffc_number : null,
        show_phone !== undefined ? show_phone : null,
        enable_whatsapp !== undefined ? enable_whatsapp : null,
        userId,
      ]
    );
  } else {
    await query(
      `INSERT INTO agent_profiles (user_id, bio, areas_served, specializations, commission_rate, eaab_number, ffc_number, show_phone, enable_whatsapp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        bio || null,
        areas_served || null,
        specializations || null,
        commission_rate || null,
        eaab_number || null,
        ffc_number || null,
        show_phone !== undefined ? show_phone : true,
        enable_whatsapp !== undefined ? enable_whatsapp : true,
      ]
    );
  }

  return NextResponse.json({ success: true });
}
