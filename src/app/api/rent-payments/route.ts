import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/rent-payments - List payments
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const propertyId = searchParams.get('property_id');
  const status = searchParams.get('status');
  const month = searchParams.get('month'); // YYYY-MM format

  let sql = `
    SELECT rp.*, 
           t.tenant_name, t.tenant_email,
           p.title as property_title, p.address as property_address
    FROM rent_payments rp
    JOIN tenants t ON rp.tenant_id = t.id
    JOIN properties p ON rp.property_id = p.id
    WHERE t.landlord_id = $1
  `;
  const params: (string | number)[] = [parseInt(session.user.id)];
  let paramIndex = 2;

  if (tenantId) {
    sql += ` AND rp.tenant_id = $${paramIndex}`;
    params.push(parseInt(tenantId));
    paramIndex++;
  }

  if (propertyId) {
    sql += ` AND rp.property_id = $${paramIndex}`;
    params.push(parseInt(propertyId));
    paramIndex++;
  }

  if (status) {
    sql += ` AND rp.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (month) {
    sql += ` AND TO_CHAR(rp.due_date, 'YYYY-MM') = $${paramIndex}`;
    params.push(month);
    paramIndex++;
  }

  sql += ' ORDER BY rp.due_date DESC';

  const result = await query(sql, params);
  return NextResponse.json(result.rows);
}

// POST /api/rent-payments - Record a payment
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    tenant_id,
    amount,
    due_date,
    period_start,
    period_end,
    paid_date,
    paid_amount,
    payment_method,
    payment_reference,
    status = 'pending',
    notes,
  } = body;

  // Verify landlord owns the tenant record
  const tenantCheck = await query(
    'SELECT property_id FROM tenants WHERE id = $1 AND landlord_id = $2',
    [tenant_id, parseInt(session.user.id)]
  );

  if (tenantCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
  }

  const propertyId = tenantCheck.rows[0].property_id;

  const result = await query(
    `INSERT INTO rent_payments (
      tenant_id, property_id, amount, due_date, period_start, period_end,
      paid_date, paid_amount, payment_method, payment_reference, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      tenant_id,
      propertyId,
      amount,
      due_date,
      period_start || null,
      period_end || null,
      paid_date || null,
      paid_amount || null,
      payment_method || null,
      payment_reference || null,
      status,
      notes || null,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
