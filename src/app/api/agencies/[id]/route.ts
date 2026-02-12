import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/agencies/[id] - Get agency details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await query(
    `SELECT a.*,
      (SELECT COUNT(*) FROM agency_members WHERE agency_id = a.id AND status = 'active') as agent_count,
      (SELECT COUNT(*) FROM properties WHERE agency_id = a.id) as listing_count,
      u.name as owner_name
     FROM agencies a
     LEFT JOIN users u ON a.owner_id = u.id
     WHERE a.id = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// PATCH/PUT /api/agencies/[id] - Update agency
async function updateAgency(
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
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const updates: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramCount = 0;

  // Support both camelCase and snake_case keys
  const fields = [
    { keys: ['name'], column: 'name' },
    { keys: ['description'], column: 'description' },
    { keys: ['logoUrl', 'logo_url'], column: 'logo_url' },
    { keys: ['coverImage', 'cover_image'], column: 'cover_image' },
    { keys: ['email'], column: 'email' },
    { keys: ['phone'], column: 'phone' },
    { keys: ['website'], column: 'website' },
    { keys: ['address'], column: 'address' },
    { keys: ['city'], column: 'city' },
    { keys: ['province'], column: 'province' },
    { keys: ['eaabNumber', 'eaab_number'], column: 'eaab_number' },
    { keys: ['fidelityFundNumber', 'fidelity_fund_number'], column: 'fidelity_fund_number' },
    { keys: ['commissionSplit', 'commission_split'], column: 'commission_split' },
  ];

  for (const field of fields) {
    const value = field.keys.map(k => body[k]).find(v => v !== undefined);
    if (value !== undefined) {
      updates.push(`${field.column} = $${++paramCount}`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(parseInt(id));

  const result = await query(
    `UPDATE agencies SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount + 1} RETURNING *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

export const PATCH = updateAgency;
export const PUT = updateAgency;
