import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");
    const { id } = await params;
    const paymentId = parseInt(id);

    // Verify user owns this payment
    const result = await query(
      `SELECT rp.* FROM rent_payments rp
       JOIN tenants t ON rp.tenant_id = t.id
       WHERE rp.id = $1 AND t.user_id = $2`,
      [paymentId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}
