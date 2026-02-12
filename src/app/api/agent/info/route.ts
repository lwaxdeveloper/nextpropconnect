import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/agent/info - Get agent info for sidebar permissions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasAgency: false, isAgencyOwner: false });
  }

  const userId = parseInt(session.user.id);

  // Check if user owns an agency
  const agencyResult = await query(
    `SELECT id FROM agencies WHERE owner_id = $1 LIMIT 1`,
    [userId]
  );

  // Check if user belongs to an agency (via agent_profiles)
  const memberResult = await query(
    `SELECT agency_id FROM agent_profiles WHERE user_id = $1 AND agency_id IS NOT NULL LIMIT 1`,
    [userId]
  );

  const isAgencyOwner = agencyResult.rows.length > 0;
  const hasAgency = isAgencyOwner || memberResult.rows.length > 0;

  return NextResponse.json({
    hasAgency,
    isAgencyOwner,
  });
}
