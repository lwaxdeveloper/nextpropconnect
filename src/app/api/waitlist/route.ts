import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, role, area } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const validRoles = ["buyer", "seller", "agent"];
    const waitlistRole = validRoles.includes(role) ? role : "buyer";

    // Upsert — if email exists, update
    await query(
      `INSERT INTO waitlist (name, email, phone, role, area)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, waitlist.name),
         phone = COALESCE(EXCLUDED.phone, waitlist.phone),
         role = EXCLUDED.role,
         area = COALESCE(EXCLUDED.area, waitlist.area)`,
      [name || null, email, phone || null, waitlistRole, area || null]
    );

    return NextResponse.json({ success: true, message: "You're on the list! 🎉" });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
