import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/admin/verifications/[id] - Get verification details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin
  const adminCheck = await query('SELECT role FROM users WHERE id = $1', [parseInt(session.user.id)]);
  if (adminCheck.rows[0]?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const result = await query(
    `SELECT 
      v.*,
      u.name as user_name,
      u.email as user_email,
      u.avatar_url as user_avatar,
      u.phone as user_phone,
      u.role as user_role,
      p.title as property_title,
      p.address as property_address,
      p.images as property_images
     FROM verifications v
     JOIN users u ON v.user_id = u.id
     LEFT JOIN properties p ON v.property_id = p.id
     WHERE v.id = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// PATCH /api/admin/verifications/[id] - Approve or reject verification
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminId = parseInt(session.user.id);

  // Check admin
  const adminCheck = await query('SELECT role FROM users WHERE id = $1', [adminId]);
  if (adminCheck.rows[0]?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { action, rejectionReason } = body;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Get verification
  const verificationResult = await query(
    'SELECT * FROM verifications WHERE id = $1',
    [parseInt(id)]
  );

  if (verificationResult.rows.length === 0) {
    return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
  }

  const verification = verificationResult.rows[0];

  if (verification.status !== 'pending') {
    return NextResponse.json({ error: 'Verification already processed' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const expiresAt = action === 'approve' 
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    : null;

  // Update verification
  await query(
    `UPDATE verifications 
     SET status = $1, reviewed_at = NOW(), reviewed_by = $2, rejection_reason = $3, expires_at = $4
     WHERE id = $5`,
    [newStatus, adminId, action === 'reject' ? rejectionReason : null, expiresAt, parseInt(id)]
  );

  // If approved, update user/property verification status
  if (action === 'approve') {
    if (verification.type === 'identity') {
      await query(
        `UPDATE users 
         SET identity_verified = true, identity_verified_at = NOW(), verification_badge = 'blue_tick'
         WHERE id = $1`,
        [verification.user_id]
      );
    } else if (verification.type === 'agent') {
      await query(
        `UPDATE users 
         SET agent_verified = true, agent_verified_at = NOW(), verification_badge = 'verified_agent'
         WHERE id = $1`,
        [verification.user_id]
      );
    } else if (verification.type === 'property' && verification.property_id) {
      await query(
        `UPDATE properties 
         SET ownership_verified = true, ownership_verified_at = NOW()
         WHERE id = $1`,
        [verification.property_id]
      );
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
