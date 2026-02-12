import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import crypto from "crypto";

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
    const transactionRef = `PC-${tenant.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create payment record
    const paymentResult = await query(
      `INSERT INTO rent_payments (tenant_id, amount, due_date, status, payment_reference, notes)
       VALUES ($1, $2, CURRENT_DATE, 'pending', $3, $4)
       RETURNING id`,
      [tenant.id, amount, transactionRef, description || `${payment_type} payment`]
    );

    const paymentId = paymentResult.rows[0].id;

    // Generate Ozow payment URL
    const siteCode = process.env.OZOW_SITE_CODE;
    const privateKey = process.env.OZOW_PRIVATE_KEY;
    const apiKey = process.env.OZOW_API_KEY;
    const isTest = process.env.OZOW_TEST_MODE === "true";

    if (!siteCode || !privateKey) {
      // Fallback for development
      return NextResponse.json({ 
        error: "Payment gateway not configured",
        paymentId 
      }, { status: 500 });
    }

    const countryCode = "ZA";
    const currencyCode = "ZAR";
    const amountStr = amount.toFixed(2);
    const successUrl = `${process.env.NEXTAUTH_URL}/renter/payments/success?ref=${transactionRef}`;
    const errorUrl = `${process.env.NEXTAUTH_URL}/renter/payments/error?ref=${transactionRef}`;
    const cancelUrl = `${process.env.NEXTAUTH_URL}/renter/payments?cancelled=true`;
    const notifyUrl = `${process.env.NEXTAUTH_URL}/api/payments/ozow-notify`;

    // Generate hash
    const hashInput = `${siteCode}${countryCode}${currencyCode}${amountStr}${transactionRef}${user.email || ''}PropConnect Rent Payment${successUrl}${errorUrl}${cancelUrl}${notifyUrl}${isTest}${privateKey}`;
    const hashCheck = crypto.createHash("sha512").update(hashInput.toLowerCase()).digest("hex");

    // Build Ozow URL
    const params = new URLSearchParams({
      SiteCode: siteCode,
      CountryCode: countryCode,
      CurrencyCode: currencyCode,
      Amount: amountStr,
      TransactionReference: transactionRef,
      BankReference: `PropConnect-${tenant.property_id}`,
      Customer: user.email || "",
      Optional1: paymentId.toString(),
      Optional2: tenant.id.toString(),
      Optional3: payment_type || "rent",
      SuccessUrl: successUrl,
      ErrorUrl: errorUrl,
      CancelUrl: cancelUrl,
      NotifyUrl: notifyUrl,
      IsTest: isTest.toString(),
      HashCheck: hashCheck,
    });

    const redirectUrl = `https://pay.ozow.com/?${params.toString()}`;

    return NextResponse.json({ redirectUrl, paymentId, transactionRef });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
