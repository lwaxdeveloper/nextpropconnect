import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// PATCH /api/rent-payments/[id] - Update payment (mark as paid, etc.)
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

  // Verify ownership through tenant -> landlord
  const check = await query(
    `SELECT rp.id FROM rent_payments rp
     JOIN tenants t ON rp.tenant_id = t.id
     WHERE rp.id = $1 AND t.landlord_id = $2`,
    [parseInt(id), parseInt(session.user.id)]
  );

  if (check.rows.length === 0) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const allowedFields = [
    'paid_date', 'paid_amount', 'payment_method', 
    'payment_reference', 'status', 'notes'
  ];

  const updates: string[] = [];
  const values: (string | number | null)[] = [];
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
    `UPDATE rent_payments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

// DELETE /api/rent-payments/[id]
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
    `DELETE FROM rent_payments rp
     USING tenants t
     WHERE rp.id = $1 AND rp.tenant_id = t.id AND t.landlord_id = $2
     RETURNING rp.id`,
    [parseInt(id), parseInt(session.user.id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
