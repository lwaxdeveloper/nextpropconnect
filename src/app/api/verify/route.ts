import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/verify - Get user's verification status
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Get user verification status
  const userResult = await query(
    `SELECT identity_verified, identity_verified_at, agent_verified, agent_verified_at, verification_badge
     FROM users WHERE id = $1`,
    [userId]
  );

  // Get pending/recent verifications
  const verificationsResult = await query(
    `SELECT id, type, status, submitted_at, reviewed_at, rejection_reason
     FROM verifications 
     WHERE user_id = $1 
     ORDER BY submitted_at DESC 
     LIMIT 10`,
    [userId]
  );

  // Get verified properties count
  const propertiesResult = await query(
    `SELECT COUNT(*) as verified_count FROM properties 
     WHERE user_id = $1 AND ownership_verified = true`,
    [userId]
  );

  const user = userResult.rows[0] || {};

  return NextResponse.json({
    identity: {
      verified: user.identity_verified || false,
      verifiedAt: user.identity_verified_at,
    },
    agent: {
      verified: user.agent_verified || false,
      verifiedAt: user.agent_verified_at,
    },
    badge: user.verification_badge,
    verifiedProperties: parseInt(propertiesResult.rows[0]?.verified_count || 0),
    verifications: verificationsResult.rows,
  });
}

// POST /api/verify - Submit a new verification request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();
  const { type, propertyId, documents, metadata } = body;

  // Validate type
  if (!['identity', 'property', 'agent'].includes(type)) {
    return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
  }

  // Check for existing pending verification of same type
  const existingResult = await query(
    `SELECT id FROM verifications 
     WHERE user_id = $1 AND type = $2 AND status = 'pending'
     ${type === 'property' ? 'AND property_id = $3' : ''}`,
    type === 'property' ? [userId, type, propertyId] : [userId, type]
  );

  if (existingResult.rows.length > 0) {
    return NextResponse.json(
      { error: 'You already have a pending verification of this type' },
      { status: 400 }
    );
  }

  // Create verification request
  const result = await query(
    `INSERT INTO verifications (user_id, type, property_id, documents, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, propertyId || null, JSON.stringify(documents || []), JSON.stringify(metadata || {})]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
