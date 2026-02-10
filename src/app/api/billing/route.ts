import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    // Get subscription
    const subResult = await query(
      `SELECT id, plan, status, price_monthly, started_at, expires_at, 
              cancelled_at, is_trial, trial_ends_at
       FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    // Get payment history
    const paymentsResult = await query(
      `SELECT id, type, amount, status, created_at, metadata
       FROM payments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    // Get invoices
    const invoicesResult = await query(
      `SELECT id, invoice_number, amount, status, due_date, paid_at, pdf_url
       FROM invoices 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    // Get or create referral code
    let referralCode = "";
    const refResult = await query(
      `SELECT code FROM referral_codes WHERE user_id = $1`,
      [userId]
    );
    
    if (refResult.rows.length > 0) {
      referralCode = refResult.rows[0].code;
    } else {
      // Generate new referral code
      referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      await query(
        `INSERT INTO referral_codes (user_id, code) VALUES ($1, $2)`,
        [userId, referralCode]
      );
    }

    // Get referral stats
    const statsResult = await query(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(credit_amount), 0) as earnings
       FROM referrals 
       WHERE referrer_id = $1 AND status = 'credited'`,
      [userId]
    );

    return NextResponse.json({
      subscription: subResult.rows[0] || null,
      payments: paymentsResult.rows,
      invoices: invoicesResult.rows,
      referralCode,
      referralStats: {
        count: parseInt(statsResult.rows[0]?.count || "0"),
        earnings: parseInt(statsResult.rows[0]?.earnings || "0"),
      },
    });
  } catch (error) {
    console.error("[Billing] Error:", error);
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}
