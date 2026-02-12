import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/verify/email - Send verification code
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store code
  await query(
    `UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE id = $3`,
    [code, expires.toISOString(), userId]
  );

  // Get user email
  const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
  const email = userResult.rows[0]?.email;

  // Send verification email
  const emailSent = await sendVerificationEmail(email, code);
  
  if (!emailSent) {
    console.error(`[EMAIL VERIFICATION] Failed to send to ${email}`);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send verification email. Please try again.' 
    }, { status: 500 });
  }

  console.log(`[EMAIL VERIFICATION] Code sent to ${email}`);

  return NextResponse.json({ 
    success: true, 
    message: 'Verification code sent to your email'
  });
}

// PATCH /api/verify/email - Verify code
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const { code } = await request.json();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  // Check code
  const result = await query(
    `SELECT verification_code, verification_code_expires FROM users WHERE id = $1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.verification_code !== code) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  if (new Date(user.verification_code_expires) < new Date()) {
    return NextResponse.json({ error: 'Code expired' }, { status: 400 });
  }

  // Mark verified
  await query(
    `UPDATE users SET 
      email_verified = true, 
      email_verified_at = NOW(),
      verification_code = NULL,
      verification_code_expires = NULL
     WHERE id = $1`,
    [userId]
  );

  return NextResponse.json({ success: true, message: 'Email verified!' });
}
