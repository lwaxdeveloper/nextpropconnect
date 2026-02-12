import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import crypto from 'crypto';

// GET /api/agencies/[id]/members - List agency members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is member of agency
  const memberCheck = await query(
    `SELECT role FROM agency_members WHERE agency_id = $1 AND user_id = $2 AND status = 'active'`,
    [parseInt(id), parseInt(session.user.id)]
  );

  if (memberCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Not a member of this agency' }, { status: 403 });
  }

  const result = await query(
    `SELECT am.*, u.name, u.email, u.avatar_url, u.phone,
      u.identity_verified, u.agent_verified,
      (SELECT COUNT(*) FROM properties WHERE user_id = u.id) as listing_count
     FROM agency_members am
     JOIN users u ON am.user_id = u.id
     WHERE am.agency_id = $1
     ORDER BY 
       CASE am.role 
         WHEN 'owner' THEN 1 
         WHEN 'admin' THEN 2 
         ELSE 3 
       END,
       am.joined_at`,
    [parseInt(id)]
  );

  // Get pending invites if admin/owner
  const role = memberCheck.rows[0].role;
  let invites: unknown[] = [];
  if (role === 'owner' || role === 'admin') {
    const invitesResult = await query(
      `SELECT ai.*, u.name as invited_by_name
       FROM agency_invites ai
       LEFT JOIN users u ON ai.invited_by = u.id
       WHERE ai.agency_id = $1 AND ai.accepted_at IS NULL AND ai.expires_at > NOW()
       ORDER BY ai.created_at DESC`,
      [parseInt(id)]
    );
    invites = invitesResult.rows;
  }

  return NextResponse.json({
    members: result.rows,
    invites,
  });
}

// POST /api/agencies/[id]/members - Invite a new member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Check if user is owner or admin
  const memberCheck = await query(
    `SELECT role FROM agency_members 
     WHERE agency_id = $1 AND user_id = $2 AND role IN ('owner', 'admin') AND status = 'active'`,
    [parseInt(id), userId]
  );

  if (memberCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Check if user already a member
  const existingMember = await query(
    `SELECT am.id FROM agency_members am
     JOIN users u ON am.user_id = u.id
     WHERE am.agency_id = $1 AND u.email = $2`,
    [parseInt(id), email]
  );

  if (existingMember.rows.length > 0) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
  }

  // Check for existing pending invite
  const existingInvite = await query(
    `SELECT id FROM agency_invites 
     WHERE agency_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
    [parseInt(id), email]
  );

  if (existingInvite.rows.length > 0) {
    return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 });
  }

  // Create invite
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await query(
    `INSERT INTO agency_invites (agency_id, email, role, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [parseInt(id), email, role || 'agent', token, userId, expiresAt.toISOString()]
  );

  // TODO: Send invitation email

  return NextResponse.json({
    ...result.rows[0],
    invite_link: `/agency/join?token=${token}`,
  }, { status: 201 });
}
