import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/properties/[id]/units/[unitId] - Get unit details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await params;

  const result = await query(
    `SELECT u.*, 
      p.title as property_title,
      p.address as property_address,
      p.city as property_city,
      t.id as tenant_id,
      t.tenant_name,
      t.tenant_email,
      t.tenant_phone,
      t.lease_start,
      t.lease_end,
      t.status as tenant_status
     FROM property_units u
     JOIN properties p ON u.property_id = p.id
     LEFT JOIN tenants t ON t.unit_id = u.id AND t.status = 'active'
     WHERE u.id = $1 AND u.property_id = $2`,
    [parseInt(unitId), parseInt(id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// PATCH /api/properties/[id]/units/[unitId] - Update unit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Verify property ownership
  const propertyCheck = await query(
    'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
    [parseInt(id), userId]
  );

  if (propertyCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const updates: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramCount = 0;

  const fields = [
    { key: 'unitName', column: 'unit_name' },
    { key: 'description', column: 'description' },
    { key: 'rentAmount', column: 'rent_amount' },
    { key: 'depositAmount', column: 'deposit_amount' },
    { key: 'isFurnished', column: 'is_furnished' },
    { key: 'hasOwnBathroom', column: 'has_own_bathroom' },
    { key: 'hasOwnEntrance', column: 'has_own_entrance' },
    { key: 'maxOccupants', column: 'max_occupants' },
    { key: 'status', column: 'status' },
  ];

  for (const field of fields) {
    if (body[field.key] !== undefined) {
      updates.push(`${field.column} = $${++paramCount}`);
      values.push(body[field.key]);
    }
  }

  if (body.amenities !== undefined) {
    updates.push(`amenities = $${++paramCount}`);
    values.push(JSON.stringify(body.amenities));
  }

  if (body.images !== undefined) {
    updates.push(`images = $${++paramCount}`);
    values.push(JSON.stringify(body.images));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(parseInt(unitId));

  const result = await query(
    `UPDATE property_units SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

// DELETE /api/properties/[id]/units/[unitId] - Delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Verify property ownership
  const propertyCheck = await query(
    'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
    [parseInt(id), userId]
  );

  if (propertyCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Check for active tenants
  const tenantCheck = await query(
    "SELECT id FROM tenants WHERE unit_id = $1 AND status = 'active'",
    [parseInt(unitId)]
  );

  if (tenantCheck.rows.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete unit with active tenant' },
      { status: 400 }
    );
  }

  await query('DELETE FROM property_units WHERE id = $1', [parseInt(unitId)]);

  // Update property unit count
  await query(
    `UPDATE properties 
     SET total_units = (SELECT COUNT(*) FROM property_units WHERE property_id = $1),
         is_multi_unit = (SELECT COUNT(*) > 0 FROM property_units WHERE property_id = $1)
     WHERE id = $1`,
    [parseInt(id)]
  );

  return NextResponse.json({ success: true });
}
