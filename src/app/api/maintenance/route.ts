import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/maintenance - List maintenance requests
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('property_id');
  const status = searchParams.get('status');
  const role = searchParams.get('role') || 'landlord'; // landlord or tenant

  let sql: string;
  let params: (string | number)[];

  if (role === 'tenant') {
    // Tenant viewing their own requests
    sql = `
      SELECT mr.*, p.title as property_title, p.address as property_address
      FROM maintenance_requests mr
      JOIN tenants t ON mr.tenant_id = t.id
      JOIN properties p ON mr.property_id = p.id
      WHERE t.user_id = $1
    `;
    params = [parseInt(session.user.id)];
  } else {
    // Landlord viewing all requests for their properties
    sql = `
      SELECT mr.*, 
             t.tenant_name, t.tenant_email,
             p.title as property_title, p.address as property_address
      FROM maintenance_requests mr
      JOIN tenants t ON mr.tenant_id = t.id
      JOIN properties p ON mr.property_id = p.id
      WHERE t.landlord_id = $1
    `;
    params = [parseInt(session.user.id)];
  }

  let paramIndex = 2;

  if (propertyId) {
    sql += ` AND mr.property_id = $${paramIndex}`;
    params.push(parseInt(propertyId));
    paramIndex++;
  }

  if (status) {
    sql += ` AND mr.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  sql += ' ORDER BY mr.created_at DESC';

  const result = await query(sql, params);
  return NextResponse.json(result.rows);
}

// POST /api/maintenance - Create maintenance request (tenant)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, category, priority = 'normal', images = [] } = body;

  // Find tenant record for this user
  const tenantCheck = await query(
    `SELECT id, property_id FROM tenants 
     WHERE user_id = $1 AND status = 'active' 
     LIMIT 1`,
    [parseInt(session.user.id)]
  );

  if (tenantCheck.rows.length === 0) {
    return NextResponse.json({ error: 'No active tenancy found' }, { status: 403 });
  }

  const { id: tenantId, property_id: propertyId } = tenantCheck.rows[0];

  const result = await query(
    `INSERT INTO maintenance_requests (
      tenant_id, property_id, title, description, category, priority, images
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [tenantId, propertyId, title, description, category || null, priority, images]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
