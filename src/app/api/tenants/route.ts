import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/tenants - List tenants for landlord
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('property_id');
  const status = searchParams.get('status');

  let sql = `
    SELECT t.*, 
           p.title as property_title, 
           p.address as property_address,
           u.name as tenant_user_name,
           u.email as tenant_user_email
    FROM tenants t
    JOIN properties p ON t.property_id = p.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.landlord_id = $1
  `;
  const params: (string | number)[] = [parseInt(session.user.id)];
  let paramIndex = 2;

  if (propertyId) {
    sql += ` AND t.property_id = $${paramIndex}`;
    params.push(parseInt(propertyId));
    paramIndex++;
  }

  if (status) {
    sql += ` AND t.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  sql += ' ORDER BY t.created_at DESC';

  const result = await query(sql, params);
  return NextResponse.json(result.rows);
}

// POST /api/tenants - Create new tenant
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    property_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    lease_start,
    lease_end,
    rent_amount,
    rent_due_day = 1,
    deposit_amount,
    deposit_paid = false,
  } = body;

  // Verify landlord owns the property
  const propertyCheck = await query(
    'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
    [property_id, parseInt(session.user.id)]
  );

  if (propertyCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Property not found or not owned by you' }, { status: 403 });
  }

  // Check if tenant email matches an existing user
  let userId = null;
  if (tenant_email) {
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [tenant_email]);
    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;
    }
  }

  const result = await query(
    `INSERT INTO tenants (
      user_id, property_id, landlord_id, tenant_name, tenant_email, tenant_phone,
      lease_start, lease_end, rent_amount, rent_due_day, deposit_amount, deposit_paid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      userId,
      property_id,
      parseInt(session.user.id),
      tenant_name,
      tenant_email,
      tenant_phone,
      lease_start,
      lease_end || null,
      rent_amount,
      rent_due_day,
      deposit_amount || null,
      deposit_paid,
    ]
  );

  // Mark property as rental managed
  await query('UPDATE properties SET is_rental_managed = true WHERE id = $1', [property_id]);

  return NextResponse.json(result.rows[0], { status: 201 });
}
