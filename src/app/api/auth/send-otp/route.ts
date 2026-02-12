import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Rate limiting
const otpAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = otpAttempts.get(key);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    otpAttempts.set(key, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  record.count++;
  record.lastAttempt = now;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Rate limit by email
    if (isRateLimited(email.toLowerCase())) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // For login, check if user exists
    if (type === "login") {
      const userResult = await query("SELECT id FROM users WHERE email = $1", [emailLower]);
      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: "No account found with this email" },
          { status: 404 }
        );
      }
    }

    // For register, check if user already exists
    if (type === "register") {
      const userResult = await query("SELECT id FROM users WHERE email = $1", [emailLower]);
      if (userResult.rows.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await query(
      `INSERT INTO otp_codes (email, code, type, expires_at) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, type) DO UPDATE SET code = $2, expires_at = $4, attempts = 0`,
      [emailLower, otp, type, expiresAt]
    );

    // Send email
    await sendEmail({
      to: email,
      subject: type === "login" ? "Your login code" : "Verify your email",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">
            ${type === "login" ? "Sign in to NextPropConnect" : "Verify your email"}
          </h2>
          <p style="color: #666; margin-bottom: 20px;">
            ${type === "login" 
              ? "Use this code to sign in to your account:" 
              : "Use this code to verify your email address:"}
          </p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a;">
              ${otp}
            </span>
          </div>
          <p style="color: #999; font-size: 14px;">
            This code expires in 10 minutes. If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`[OTP] Sent ${type} OTP to ${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OTP] Error sending OTP:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
