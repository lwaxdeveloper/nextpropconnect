import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/agencies - List agencies or get user's agency
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine');
  const slug = searchParams.get('slug');

  if (mine === 'true') {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user owns or belongs to an agency
    const memberResult = await query(
      `SELECT a.*, am.role as member_role
       FROM agencies a
       JOIN agency_members am ON a.id = am.agency_id
       WHERE am.user_id = $1 AND am.status = 'active'`,
      [userId]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ agency: null });
    }

    return NextResponse.json({ agency: memberResult.rows[0] });
  }

  if (slug) {
    const result = await query(
      `SELECT a.*, 
        (SELECT COUNT(*) FROM agency_members WHERE agency_id = a.id AND status = 'active') as agent_count,
        (SELECT COUNT(*) FROM properties WHERE agency_id = a.id) as listing_count
       FROM agencies a
       WHERE a.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  }

  // List all verified agencies
  const result = await query(
    `SELECT a.id, a.name, a.slug, a.logo_url, a.city, a.is_verified,
      (SELECT COUNT(*) FROM agency_members WHERE agency_id = a.id AND status = 'active') as agent_count
     FROM agencies a
     WHERE a.is_verified = true OR a.subscription_tier != 'basic'
     ORDER BY a.name
     LIMIT 50`
  );

  return NextResponse.json({ agencies: result.rows });
}

// POST /api/agencies - Create a new agency
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  const {
    name,
    description,
    email,
    phone,
    website,
    address,
    city,
    province,
    eaabNumber,
    fidelityFundNumber,
  } = body;

  if (!name) {
    return NextResponse.json({ error: 'Agency name is required' }, { status: 400 });
  }

  // Generate slug
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if slug exists
  const slugCheck = await query('SELECT id FROM agencies WHERE slug = $1', [slug]);
  if (slugCheck.rows.length > 0) {
    return NextResponse.json({ error: 'Agency name already taken' }, { status: 400 });
  }

  // Check if user already owns an agency
  const ownerCheck = await query('SELECT id FROM agencies WHERE owner_id = $1', [userId]);
  if (ownerCheck.rows.length > 0) {
    return NextResponse.json({ error: 'You already own an agency' }, { status: 400 });
  }

  // Create agency
  const result = await query(
    `INSERT INTO agencies (name, slug, description, email, phone, website, address, city, province, eaab_number, fidelity_fund_number, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [name, slug, description, email, phone, website, address, city, province, eaabNumber, fidelityFundNumber, userId]
  );

  const agency = result.rows[0];

  // Add owner as member
  await query(
    `INSERT INTO agency_members (agency_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [agency.id, userId]
  );

  // Update user's agency_id
  await query('UPDATE users SET agency_id = $1 WHERE id = $2', [agency.id, userId]);

  return NextResponse.json(agency, { status: 201 });
}
