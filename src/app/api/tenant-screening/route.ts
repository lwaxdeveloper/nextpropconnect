import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/tenant-screening - Get screenings (landlord's requests or tenant's own)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'landlord'; // 'landlord' or 'tenant'

  let result;
  if (role === 'tenant') {
    // Tenant viewing their own screenings
    result = await query(
      `SELECT ts.*, 
        u.name as landlord_name,
        p.title as property_title,
        p.address as property_address
       FROM tenant_screenings ts
       JOIN users u ON ts.requested_by = u.id
       LEFT JOIN properties p ON ts.property_id = p.id
       WHERE ts.tenant_id = $1
       ORDER BY ts.created_at DESC`,
      [userId]
    );
  } else {
    // Landlord viewing their screening requests
    result = await query(
      `SELECT ts.*, 
        u.name as tenant_name,
        u.email as tenant_email,
        u.phone as tenant_phone,
        u.avatar_url as tenant_avatar,
        p.title as property_title
       FROM tenant_screenings ts
       JOIN users u ON ts.tenant_id = u.id
       LEFT JOIN properties p ON ts.property_id = p.id
       WHERE ts.requested_by = $1
       ORDER BY ts.created_at DESC`,
      [userId]
    );
  }

  return NextResponse.json({ screenings: result.rows });
}

// POST /api/tenant-screening - Request a tenant screening
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const landlordId = parseInt(session.user.id);
  const body = await request.json();
  const { tenantId, tenantEmail, propertyId, monthlyRent } = body;

  let actualTenantId = tenantId;

  // If tenantEmail provided, find or invite user
  if (!actualTenantId && tenantEmail) {
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [tenantEmail]
    );
    
    if (userResult.rows.length > 0) {
      actualTenantId = userResult.rows[0].id;
    } else {
      return NextResponse.json(
        { error: 'Tenant not found. They need to register first.' },
        { status: 404 }
      );
    }
  }

  if (!actualTenantId) {
    return NextResponse.json({ error: 'Tenant ID or email required' }, { status: 400 });
  }

  // Check for existing pending screening
  const existingResult = await query(
    `SELECT id FROM tenant_screenings 
     WHERE tenant_id = $1 AND requested_by = $2 AND status = 'pending'`,
    [actualTenantId, landlordId]
  );

  if (existingResult.rows.length > 0) {
    return NextResponse.json(
      { error: 'You already have a pending screening for this tenant' },
      { status: 400 }
    );
  }

  // Create screening request
  const result = await query(
    `INSERT INTO tenant_screenings (tenant_id, requested_by, property_id, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [actualTenantId, landlordId, propertyId || null, monthlyRent ? `Monthly rent: R${monthlyRent}` : null]
  );

  // TODO: Send notification to tenant

  return NextResponse.json(result.rows[0], { status: 201 });
}
