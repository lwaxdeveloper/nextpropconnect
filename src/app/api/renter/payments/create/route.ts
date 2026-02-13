import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { createPaymentUrl, isOzowConfigured } from "@/lib/ozow";
import crypto from "crypto";

const BASE_URL = process.env.NEXTAUTH_URL || "https://nextpropconnect.co.za";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string; email?: string; name?: string };
    const userId = parseInt(user.id || "0");

    const { amount, payment_type, description } = await request.json();

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum payment amount is R100" }, { status: 400 });
    }

    // Get tenant info
    const tenantResult = await query(
      `SELECT t.id, t.property_id, t.landlord_id, p.title
       FROM tenants t
       JOIN properties p ON t.property_id = p.id
       WHERE t.user_id = $1 AND t.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "No active tenancy found" }, { status: 404 });
    }

    const tenant = tenantResult.rows[0];

    // Generate unique transaction reference
    const transactionRef = `PC-RENT-${tenant.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create payment record
    const paymentResult = await query(
      `INSERT INTO rent_payments (tenant_id, property_id, amount, due_date, status, payment_reference, notes)
       VALUES ($1, $2, $3, CURRENT_DATE, 'pending', $4, $5)
       RETURNING id`,
      [tenant.id, tenant.property_id, amount, transactionRef, description || `${payment_type} payment`]
    );

    const paymentId = paymentResult.rows[0].id;

    // Check if Ozow is configured
    if (!isOzowConfigured()) {
      console.log("[Rent Payment] Ozow not configured, using demo mode");
      
      // Demo mode - mark as pending and return a mock URL
      return NextResponse.json({
        demo: true,
        paymentId,
        message: "Demo mode: Payment gateway not configured",
        redirectUrl: `${BASE_URL}/renter/payments/success?ref=${transactionRef}&demo=true`,
      });
    }

    // Create Ozow payment URL
    // Note: amount is in Rands, createPaymentUrl expects cents
    const amountInCents = Math.round(amount * 100);
    
    console.log("[Rent Payment] ========================================");
    console.log("[Rent Payment] Creating Ozow payment request");
    console.log("[Rent Payment] User email:", user.email);
    console.log("[Rent Payment] Amount (Rands):", amount);
    console.log("[Rent Payment] Amount (cents):", amountInCents);
    console.log("[Rent Payment] Transaction ref:", transactionRef);
    console.log("[Rent Payment] BASE_URL:", BASE_URL);
    console.log("[Rent Payment] isOzowConfigured:", isOzowConfigured());
    console.log("[Rent Payment] ========================================");
    
    const paymentUrl = createPaymentUrl({
      transactionReference: transactionRef,
      amount: amountInCents,
      bankReference: `PropConnect-${tenant.property_id}`.substring(0, 20),
      customer: user.email || undefined,
      cancelUrl: `${BASE_URL}/renter/payments?cancelled=true`,
      errorUrl: `${BASE_URL}/renter/payments/error?ref=${transactionRef}`,
      successUrl: `${BASE_URL}/renter/payments/success?ref=${transactionRef}`,
      notifyUrl: `${BASE_URL}/api/payments/webhook`,
    });

    console.log(`[Rent Payment] Created payment ${paymentId} for tenant ${tenant.id}, amount: R${amount}`);
    console.log(`[Rent Payment] Ozow URL generated, length: ${paymentUrl.length}`);

    return NextResponse.json({ 
      redirectUrl: paymentUrl, 
      paymentId, 
      transactionRef 
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
