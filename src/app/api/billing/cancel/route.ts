import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    // Mark subscription as cancelled (will remain active until expires_at)
    await query(
      `UPDATE subscriptions 
       SET status = 'cancelled', cancelled_at = NOW() 
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Billing Cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
