import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyHash, OZOW_STATUS } from "@/lib/ozow";
import { createInvoice } from "@/lib/invoice";
import { processReferralReward } from "@/lib/subscription-lifecycle";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log("[Ozow Webhook] Received:", JSON.stringify(data));

    // Verify hash
    if (!verifyHash(data)) {
      console.error("[Ozow Webhook] Hash verification failed");
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    const { TransactionReference, TransactionId, Status, Amount, StatusMessage } = data;

    // Find payment by reference
    const paymentResult = await query(
      `SELECT id, user_id, type, amount, metadata FROM payments WHERE provider_ref = $1`,
      [TransactionReference]
    );

    if (paymentResult.rows.length === 0) {
      console.error("[Ozow Webhook] Payment not found:", TransactionReference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentResult.rows[0];
    const metadata = payment.metadata || {};

    // Update payment status
    let newStatus = "pending";
    if (Status === OZOW_STATUS.COMPLETE) {
      newStatus = "completed";
    } else if (Status === OZOW_STATUS.CANCELLED || Status === OZOW_STATUS.ABANDONED) {
      newStatus = "cancelled";
    } else if (Status === OZOW_STATUS.ERROR) {
      newStatus = "failed";
    }

    await query(
      `UPDATE payments 
       SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END
       WHERE id = $2`,
      [newStatus, payment.id]
    );

    // Process successful payment
    if (newStatus === "completed") {
      if (payment.type === "subscription") {
        // Create or update subscription
        const plan = metadata.plan;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await query(
          `INSERT INTO subscriptions (user_id, plan, price_monthly, expires_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE SET
             plan = EXCLUDED.plan,
             price_monthly = EXCLUDED.price_monthly,
             expires_at = EXCLUDED.expires_at,
             status = 'active'`,
          [payment.user_id, plan, payment.amount, expiresAt]
        );

        console.log(`[Ozow Webhook] Subscription activated for user ${payment.user_id}: ${plan}`);
      } else if (payment.type === "boost") {
        // Create listing boost
        const { propertyId, boostType, days } = metadata;
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + (days as number || 7));

        await query(
          `INSERT INTO listing_boosts (property_id, boost_type, payment_id, ends_at)
           VALUES ($1, $2, $3, $4)`,
          [propertyId, boostType, payment.id, endsAt]
        );

        // Update property to featured
        await query(
          `UPDATE properties SET is_featured = true WHERE id = $1`,
          [propertyId]
        );

        console.log(`[Ozow Webhook] Boost activated for property ${propertyId}: ${boostType}`);
      }

      // Create invoice for successful payment
      try {
        await createInvoice({
          userId: payment.user_id,
          paymentId: payment.id,
          amount: payment.amount,
          type: payment.type,
          metadata,
        });
      } catch (invoiceError) {
        console.error("[Ozow Webhook] Invoice creation failed:", invoiceError);
      }

      // Process referral rewards (first payment triggers reward)
      try {
        await processReferralReward(payment.user_id, payment.amount);
      } catch (referralError) {
        console.error("[Ozow Webhook] Referral processing failed:", referralError);
      }
    }

    console.log(`[Ozow Webhook] Payment ${payment.id} updated to ${newStatus}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Ozow Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Also handle GET for Ozow redirect
export async function GET(request: NextRequest) {
  return POST(request);
}
