import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/user/whatsapp — get WhatsApp settings
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");

  const result = await query(
    "SELECT phone, whatsapp_enabled FROM users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    phone: result.rows[0].phone,
    whatsapp_enabled: result.rows[0].whatsapp_enabled,
  });
}

// PUT /api/user/whatsapp — update WhatsApp settings
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");

  const body = await request.json();
  const { phone, whatsapp_enabled } = body;

  // Validate phone if provided
  if (phone !== undefined) {
    // Basic validation: should be a valid SA number
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 12)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    await query("UPDATE users SET phone = $1 WHERE id = $2", [
      phone || null,
      userId,
    ]);
  }

  if (whatsapp_enabled !== undefined) {
    // Check if phone exists before enabling WhatsApp
    if (whatsapp_enabled) {
      const userResult = await query(
        "SELECT phone FROM users WHERE id = $1",
        [userId]
      );
      if (!userResult.rows[0]?.phone) {
        return NextResponse.json(
          { error: "Please add a phone number first" },
          { status: 400 }
        );
      }
    }

    await query("UPDATE users SET whatsapp_enabled = $1 WHERE id = $2", [
      whatsapp_enabled,
      userId,
    ]);
  }

  // Return updated settings
  const result = await query(
    "SELECT phone, whatsapp_enabled FROM users WHERE id = $1",
    [userId]
  );

  return NextResponse.json({
    phone: result.rows[0].phone,
    whatsapp_enabled: result.rows[0].whatsapp_enabled,
  });
}
