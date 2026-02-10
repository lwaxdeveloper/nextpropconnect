import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { createPaymentUrl, isOzowConfigured, SUBSCRIPTION_PLANS, BOOST_TYPES, LISTING_FEES } from "@/lib/ozow";
import { createInvoice } from "@/lib/invoice";
import { processReferralReward } from "@/lib/subscription-lifecycle";

const BASE_URL = process.env.NEXTAUTH_URL || "https://nextnextpropconnect.co.za";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    const body = await request.json();
    const { type, plan, boostType, propertyId, amount } = body;

    if (!type) {
      return NextResponse.json({ error: "Payment type required" }, { status: 400 });
    }

    let paymentAmount = 0;
    let description = "";
    let metadata: Record<string, unknown> = { type };

    // Determine payment amount based on type
    if (type === "subscription" && plan) {
      const planData = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
      if (!planData) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      paymentAmount = planData.price;
      description = `NextPropConnect ${planData.name} Subscription`;
      metadata.plan = plan;
    } else if (type === "boost" && boostType && propertyId) {
      const boost = BOOST_TYPES[boostType as keyof typeof BOOST_TYPES];
      if (!boost) {
        return NextResponse.json({ error: "Invalid boost type" }, { status: 400 });
      }
      paymentAmount = boost.price;
      description = `${boost.name} - Property #${propertyId}`;
      metadata.boostType = boostType;
      metadata.propertyId = propertyId;
      metadata.days = boost.days;
    } else if (type === "listing" && plan) {
      const listingFee = LISTING_FEES[plan as keyof typeof LISTING_FEES];
      if (!listingFee) {
        return NextResponse.json({ error: "Invalid listing plan" }, { status: 400 });
      }
      paymentAmount = listingFee.price;
      description = `NextPropConnect ${listingFee.name}`;
      metadata.listingPlan = plan;
    } else if (amount) {
      paymentAmount = amount;
      description = body.description || "NextPropConnect Payment";
    } else {
      return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
    }

    // Create payment record
    const paymentResult = await query(
      `INSERT INTO payments (user_id, type, amount, status, metadata)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id`,
      [userId, type, paymentAmount, JSON.stringify(metadata)]
    );

    const paymentId = paymentResult.rows[0].id;

    // Check if Ozow is configured
    if (!isOzowConfigured()) {
      // Demo mode - simulate successful payment and activate immediately
      console.log("[Payments] Ozow not configured, using demo mode");
      
      // Mark payment as completed
      await query(
        `UPDATE payments SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [paymentId]
      );

      // Activate subscription/boost immediately
      if (type === "subscription" && plan) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        
        await query(
          `INSERT INTO subscriptions (user_id, plan, price_monthly, expires_at, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT (user_id) DO UPDATE SET
             plan = EXCLUDED.plan,
             price_monthly = EXCLUDED.price_monthly,
             expires_at = EXCLUDED.expires_at,
             status = 'active',
             is_trial = false`,
          [userId, plan, paymentAmount, expiresAt]
        );
        console.log(`[Payments Demo] Subscription activated: ${plan}`);
      } else if (type === "boost" && boostType && propertyId) {
        const boost = BOOST_TYPES[boostType as keyof typeof BOOST_TYPES];
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + boost.days);

        await query(
          `INSERT INTO listing_boosts (property_id, boost_type, payment_id, ends_at)
           VALUES ($1, $2, $3, $4)`,
          [propertyId, boostType, paymentId, endsAt]
        );
        await query(
          `UPDATE properties SET is_featured = true WHERE id = $1`,
          [propertyId]
        );
        console.log(`[Payments Demo] Boost activated: ${boostType} for property ${propertyId}`);
      }

      // Create invoice for demo payment
      try {
        await createInvoice({
          userId,
          paymentId,
          amount: paymentAmount,
          type,
          metadata,
        });
      } catch (invoiceError) {
        console.error("[Payments Demo] Invoice creation failed:", invoiceError);
      }

      // Process referral rewards
      try {
        await processReferralReward(userId, paymentAmount);
      } catch (referralError) {
        console.error("[Payments Demo] Referral processing failed:", referralError);
      }

      return NextResponse.json({
        demo: true,
        paymentId,
        message: "Demo mode: Payment processed successfully",
        paymentUrl: `${BASE_URL}/payment/success?ref=${paymentId}&demo=true`,
      });
    }

    // Create Ozow payment URL
    const transactionReference = `PC-${paymentId}-${Date.now()}`;
    
    const paymentUrl = createPaymentUrl({
      transactionReference,
      amount: paymentAmount,
      bankReference: description.substring(0, 20),
      customer: (session.user as { email?: string }).email || undefined,
      cancelUrl: `${BASE_URL}/payment/cancelled?ref=${paymentId}`,
      errorUrl: `${BASE_URL}/payment/error?ref=${paymentId}`,
      successUrl: `${BASE_URL}/payment/success?ref=${paymentId}`,
      notifyUrl: `${BASE_URL}/api/payments/webhook`,
    });

    // Update payment with transaction reference
    await query(
      `UPDATE payments SET provider_ref = $1 WHERE id = $2`,
      [transactionReference, paymentId]
    );

    return NextResponse.json({
      paymentId,
      paymentUrl,
      transactionReference,
    });
  } catch (error) {
    console.error("[Payments] Error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
