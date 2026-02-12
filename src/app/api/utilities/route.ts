import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/utilities - List utilities for landlord's properties
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  let whereClause = 'WHERE p.user_id = $1';
  const params: (string | number)[] = [userId];

  if (propertyId) {
    whereClause += ' AND su.property_id = $2';
    params.push(parseInt(propertyId));
  }

  const result = await query(
    `SELECT su.*, 
      p.title as property_title,
      (SELECT COUNT(*) FROM utility_splits WHERE utility_id = su.id) as split_count,
      (SELECT SUM(amount) FROM utility_splits WHERE utility_id = su.id AND status = 'paid') as paid_amount
     FROM shared_utilities su
     JOIN properties p ON su.property_id = p.id
     ${whereClause}
     ORDER BY su.month DESC, su.created_at DESC`,
    params
  );

  return NextResponse.json(result.rows);
}

// POST /api/utilities - Create a new utility bill and split it
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();
  const { propertyId, month, utilityType, totalAmount, splitMethod, notes } = body;

  // Verify property ownership
  const propertyCheck = await query(
    'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
    [propertyId, userId]
  );

  if (propertyCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  // Create utility bill
  const utilityResult = await query(
    `INSERT INTO shared_utilities (property_id, month, utility_type, total_amount, split_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [propertyId, month, utilityType, totalAmount, splitMethod || 'equal', notes]
  );

  const utilityId = utilityResult.rows[0].id;

  // Get active tenants with units for this property
  const tenantsResult = await query(
    `SELECT t.id as tenant_id, t.unit_id, u.unit_name, u.max_occupants
     FROM tenants t
     JOIN property_units u ON t.unit_id = u.id
     WHERE t.property_id = $1 AND t.status = 'active'`,
    [propertyId]
  );

  if (tenantsResult.rows.length > 0) {
    const tenants = tenantsResult.rows;
    let splits: { tenantId: number; unitId: number; amount: number }[] = [];

    if (splitMethod === 'equal') {
      const perTenant = totalAmount / tenants.length;
      splits = tenants.map(t => ({
        tenantId: t.tenant_id,
        unitId: t.unit_id,
        amount: Math.round(perTenant * 100) / 100,
      }));
    } else if (splitMethod === 'by_occupants') {
      const totalOccupants = tenants.reduce((sum, t) => sum + (t.max_occupants || 1), 0);
      splits = tenants.map(t => ({
        tenantId: t.tenant_id,
        unitId: t.unit_id,
        amount: Math.round((totalAmount * (t.max_occupants || 1) / totalOccupants) * 100) / 100,
      }));
    } else {
      // Default to equal
      const perTenant = totalAmount / tenants.length;
      splits = tenants.map(t => ({
        tenantId: t.tenant_id,
        unitId: t.unit_id,
        amount: Math.round(perTenant * 100) / 100,
      }));
    }

    // Insert splits
    for (const split of splits) {
      await query(
        `INSERT INTO utility_splits (utility_id, unit_id, tenant_id, amount)
         VALUES ($1, $2, $3, $4)`,
        [utilityId, split.unitId, split.tenantId, split.amount]
      );
    }
  }

  return NextResponse.json(utilityResult.rows[0], { status: 201 });
}
