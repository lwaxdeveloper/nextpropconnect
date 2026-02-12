import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/tenants/[id] - Get tenant details
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
    `SELECT t.*, 
            p.title as property_title, 
            p.address as property_address,
            p.images as property_images,
            u.name as tenant_user_name,
            u.email as tenant_user_email
     FROM tenants t
     JOIN properties p ON t.property_id = p.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = $1 AND t.landlord_id = $2`,
    [parseInt(id), parseInt(session.user.id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Get payment history
  const payments = await query(
    `SELECT * FROM rent_payments 
     WHERE tenant_id = $1 
     ORDER BY due_date DESC 
     LIMIT 12`,
    [parseInt(id)]
  );

  // Get maintenance requests
  const maintenance = await query(
    `SELECT * FROM maintenance_requests 
     WHERE tenant_id = $1 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [parseInt(id)]
  );

  return NextResponse.json({
    ...result.rows[0],
    payments: payments.rows,
    maintenance_requests: maintenance.rows,
  });
}

// PATCH /api/tenants/[id] - Update tenant
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

  // Verify ownership
  const check = await query(
    'SELECT id FROM tenants WHERE id = $1 AND landlord_id = $2',
    [parseInt(id), parseInt(session.user.id)]
  );

  if (check.rows.length === 0) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const allowedFields = [
    'tenant_name', 'tenant_email', 'tenant_phone',
    'lease_start', 'lease_end', 'rent_amount', 'rent_due_day',
    'deposit_amount', 'deposit_paid', 'status',
    'notice_date', 'vacate_date', 'lease_document_url'
  ];

  const updates: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(body[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(parseInt(id));

  const result = await query(
    `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

// DELETE /api/tenants/[id] - Remove tenant record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const result = await query(
    'DELETE FROM tenants WHERE id = $1 AND landlord_id = $2 RETURNING id',
    [parseInt(id), parseInt(session.user.id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
