import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

// Simple in-memory rate limiting (resets on restart)
const registrationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 5; // 5 registrations per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = registrationAttempts.get(ip);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
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
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    if (isRateLimited(ip)) {
      console.log(`[Register] Rate limited: ${ip}`);
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, phone, password, role, referralCode, emailVerified } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Password strength check
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const validRoles = ["buyer", "seller", "agent"];
    const userRole = validRoles.includes(role) ? role : "buyer";
    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [emailLower]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Calculate 90-day trial period
    const trialStarted = new Date();
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 90);

    // Create user with trial period (email already verified via OTP flow)
    const userResult = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, trial_started_at, trial_ends_at, subscription_plan, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'trial', $8) RETURNING id`,
      [name, emailLower, phone || null, passwordHash, userRole, trialStarted, trialEnds, emailVerified === true]
    );
    
    const userId = userResult.rows[0].id;
    console.log(`[Register] Created user ${email} with 90-day trial ending ${trialEnds.toISOString()}, emailVerified: ${emailVerified}`);

    // If agent, create 3-month free trial subscription
    if (userRole === "agent") {
      const agentTrialEnds = new Date();
      agentTrialEnds.setMonth(agentTrialEnds.getMonth() + 3);
      
      await query(
        `INSERT INTO subscriptions (user_id, plan, price_monthly, is_trial, trial_ends_at, expires_at, status)
         VALUES ($1, 'pro', 0, true, $2, $2, 'active')`,
        [userId, agentTrialEnds]
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
        
        await query(
          `INSERT INTO referrals (referrer_id, referred_id, code, status)
           VALUES ($1, $2, $3, 'pending')`,
          [referrerId, userId, referralCode.toUpperCase()]
        );
        
        console.log(`[Register] Referral recorded: ${referrerId} -> ${userId}`);
      }
    }

    // Send welcome email (async)
    sendWelcomeEmail(email, name).catch(err => {
      console.error(`[Register] Failed to send welcome email:`, err);
    });

    return NextResponse.json({ 
      success: true,
      message: "Account created successfully!"
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
