import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, role, referralCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const validRoles = ["buyer", "seller", "agent"];
    const userRole = validRoles.includes(role) ? role : "buyer";

    // Check if user exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, email, phone || null, passwordHash, userRole]
    );
    
    const userId = userResult.rows[0].id;

    // If agent, create 3-month free trial subscription
    if (userRole === "agent") {
      const trialEnds = new Date();
      trialEnds.setMonth(trialEnds.getMonth() + 3);
      
      await query(
        `INSERT INTO subscriptions (user_id, plan, price_monthly, is_trial, trial_ends_at, expires_at, status)
         VALUES ($1, 'pro', 0, true, $2, $2, 'active')`,
        [userId, trialEnds]
      );
      
      console.log(`[Register] Created 3-month trial for agent ${email}`);
    }

    // Handle referral
    if (referralCode) {
      const refResult = await query(
        `SELECT user_id FROM referral_codes WHERE code = $1`,
        [referralCode.toUpperCase()]
      );
      
      if (refResult.rows.length > 0) {
        const referrerId = refResult.rows[0].user_id;
        
        // Record the referral (credit on first payment)
        await query(
          `INSERT INTO referrals (referrer_id, referred_id, code, status)
           VALUES ($1, $2, $3, 'pending')`,
          [referrerId, userId, referralCode.toUpperCase()]
        );
        
        console.log(`[Register] Referral recorded: ${referrerId} -> ${userId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
