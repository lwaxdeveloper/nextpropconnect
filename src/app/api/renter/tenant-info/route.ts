import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    const result = await query(
      `SELECT t.id, t.rent_amount, t.deposit_amount, t.deposit_paid, t.rent_due_day,
         t.lease_start, t.lease_end, t.property_id, t.landlord_id,
         p.title as property_title, p.address,
         u.name as landlord_name, u.email as landlord_email
       FROM tenants t
       JOIN properties p ON t.property_id = p.id
       JOIN users u ON t.landlord_id = u.id
       WHERE t.user_id = $1 AND t.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching tenant info:", error);
    return NextResponse.json({ error: "Failed to fetch tenant info" }, { status: 500 });
  }
}
