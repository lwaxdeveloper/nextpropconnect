import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/verify/phone - Send SMS verification code
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();
  const { phone } = body;

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  // Normalize SA phone number
  let normalizedPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+27' + normalizedPhone.slice(1);
  }

  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store code and phone
  await query(
    `UPDATE users SET 
      phone = $1,
      verification_code = $2, 
      verification_code_expires = $3 
     WHERE id = $4`,
    [normalizedPhone, code, expires.toISOString(), userId]
  );

  // TODO: Send actual SMS via Twilio/ClickSend/BulkSMS
  // For now, log it (in production, remove this!)
  console.log(`[SMS VERIFICATION] Code for ${normalizedPhone}: ${code}`);

  // In development, return the code (REMOVE IN PRODUCTION!)
  const isDev = process.env.NODE_ENV === 'development';

  return NextResponse.json({ 
    success: true, 
    message: 'Verification code sent via SMS',
    phone: normalizedPhone.slice(0, 6) + '****' + normalizedPhone.slice(-2),
    ...(isDev && { code }) // Only in dev
  });
}

// PATCH /api/verify/phone - Verify code
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
      phone_verified = true, 
      phone_verified_at = NOW(),
      verification_code = NULL,
      verification_code_expires = NULL
     WHERE id = $1`,
    [userId]
  );

  return NextResponse.json({ success: true, message: 'Phone verified!' });
}
