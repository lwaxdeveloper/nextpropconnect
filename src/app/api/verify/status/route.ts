import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/verify/status - Get comprehensive verification status
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Get user info with verification status
  const userResult = await query(
    `SELECT 
       u.role,
       u.identity_verified, 
       u.identity_verified_at, 
       u.agent_verified, 
       u.agent_verified_at, 
       u.verification_badge,
       u.kyc_status,
       ap.id as agent_profile_id
     FROM users u
     LEFT JOIN agent_profiles ap ON ap.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isAgent = user.role === 'agent' || !!user.agent_profile_id;

  // Check if user owns an agency
  const agencyResult = await query(
    `SELECT a.id, a.name, a.kyc_status, a.kyc_submitted_at
     FROM agencies a
     WHERE a.owner_id = $1
     LIMIT 1`,
    [userId]
  );
  
  const agency = agencyResult.rows[0];
  const hasAgency = !!agency;

  // Get pending/recent verifications
  const verificationsResult = await query(
    `SELECT id, type, status, submitted_at, reviewed_at, rejection_reason
     FROM verifications 
     WHERE user_id = $1 
     ORDER BY submitted_at DESC 
     LIMIT 10`,
    [userId]
  );

  // Get identity verification status
  const identityVerification = verificationsResult.rows.find(v => v.type === 'identity');
  
  // Get agent verification status
  const agentVerification = verificationsResult.rows.find(v => v.type === 'agent');

  // Get property counts
  const propertiesResult = await query(
    `SELECT 
       COUNT(*) as total_count,
       COUNT(*) FILTER (WHERE ownership_verified = true) as verified_count 
     FROM properties 
     WHERE user_id = $1`,
    [userId]
  );

  const properties = propertiesResult.rows[0] || { total_count: 0, verified_count: 0 };

  return NextResponse.json({
    userRole: user.role || 'user',
    isAgent,
    hasAgency,
    
    identity: {
      verified: user.identity_verified || false,
      verifiedAt: user.identity_verified_at,
      status: identityVerification?.status || (user.identity_verified ? 'approved' : 'not_started'),
    },
    
    agent: {
      verified: user.agent_verified || false,
      verifiedAt: user.agent_verified_at,
      status: agentVerification?.status || (user.agent_verified ? 'approved' : 'not_started'),
    },
    
    agency: {
      isOwner: hasAgency,
      name: agency?.name || null,
      verified: agency?.kyc_status === 'approved',
      verifiedAt: agency?.kyc_submitted_at,
      status: agency?.kyc_status || 'not_started',
    },
    
    badge: user.verification_badge,
    verifiedProperties: parseInt(properties.verified_count) || 0,
    totalProperties: parseInt(properties.total_count) || 0,
    verifications: verificationsResult.rows,
  });
}
