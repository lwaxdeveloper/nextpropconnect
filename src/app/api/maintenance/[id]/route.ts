import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/maintenance/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const result = await query(
    `SELECT mr.*, 
            t.tenant_name, t.tenant_email, t.landlord_id,
            p.title as property_title, p.address as property_address
     FROM maintenance_requests mr
     JOIN tenants t ON mr.tenant_id = t.id
     JOIN properties p ON mr.property_id = p.id
     WHERE mr.id = $1 AND (t.landlord_id = $2 OR t.user_id = $2)`,
    [parseInt(id), parseInt(session.user.id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// PATCH /api/maintenance/[id] - Update request (landlord updates status, adds notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Check if user is landlord or tenant
  const check = await query(
    `SELECT mr.id, t.landlord_id, t.user_id
     FROM maintenance_requests mr
     JOIN tenants t ON mr.tenant_id = t.id
     WHERE mr.id = $1`,
    [parseInt(id)]
  );

  if (check.rows.length === 0) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const { landlord_id, user_id } = check.rows[0];
  const isLandlord = landlord_id === parseInt(session.user.id);
  const isTenant = user_id === parseInt(session.user.id);

  if (!isLandlord && !isTenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Landlord can update: status, landlord_notes, resolution_notes
  // Tenant can update: description, images (only if status is 'new')
  const landlordFields = ['status', 'landlord_notes', 'resolution_notes'];
  const tenantFields = ['description', 'images'];

  const updates: string[] = [];
  const values: (string | number | string[] | null)[] = [];
  let paramIndex = 1;

  const allowedFields = isLandlord ? landlordFields : tenantFields;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(body[field]);
      paramIndex++;
    }
  }

  // Handle completed status
  if (body.status === 'completed' && isLandlord) {
    updates.push(`completed_at = NOW()`);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(parseInt(id));

  const result = await query(
    `UPDATE maintenance_requests SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}
