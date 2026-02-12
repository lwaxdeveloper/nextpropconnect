import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

// Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Get OTP record
    const result = await query(
      `SELECT * FROM otp_codes WHERE email = $1 AND type = 'login'`,
      [emailLower]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 404 }
      );
    }

    const record = result.rows[0];

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      await query(`DELETE FROM otp_codes WHERE email = $1 AND type = 'login'`, [emailLower]);
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempts
    if (record.attempts >= 5) {
      await query(`DELETE FROM otp_codes WHERE email = $1 AND type = 'login'`, [emailLower]);
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Verify code (timing-safe comparison)
    if (!safeCompare(record.code, otp)) {
      await query(
        `UPDATE otp_codes SET attempts = attempts + 1 WHERE email = $1 AND type = 'login'`,
        [emailLower]
      );
      return NextResponse.json(
        { error: "Invalid code. Please try again." },
        { status: 400 }
      );
    }

    // Success - delete OTP record
    await query(`DELETE FROM otp_codes WHERE email = $1 AND type = 'login'`, [emailLower]);

    // Generate a one-time login token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store token
    await query(
      `INSERT INTO login_tokens (email, token, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET token = $2, expires_at = $3`,
      [emailLower, token, tokenExpires]
    );

    console.log(`[OTP] Login OTP verified for ${email}, token generated`);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("[OTP] Login OTP error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
