import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/properties/[id]/units - List all units for a property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const result = await query(
    `SELECT u.*, 
      t.id as tenant_id,
      t.tenant_name,
      t.tenant_email,
      t.status as tenant_status
     FROM property_units u
     LEFT JOIN tenants t ON t.unit_id = u.id AND t.status = 'active'
     WHERE u.property_id = $1
     ORDER BY u.unit_name`,
    [parseInt(id)]
  );

  return NextResponse.json(result.rows);
}

// POST /api/properties/[id]/units - Create a new unit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    return NextResponse.json({ error: 'Property not found or not owned by you' }, { status: 403 });
  }

  const body = await request.json();
  const {
    unitName,
    description,
    rentAmount,
    depositAmount,
    isFurnished,
    hasOwnBathroom,
    hasOwnEntrance,
    maxOccupants,
    amenities,
    images,
  } = body;

  if (!unitName) {
    return NextResponse.json({ error: 'Unit name is required' }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO property_units 
     (property_id, unit_name, description, rent_amount, deposit_amount, 
      is_furnished, has_own_bathroom, has_own_entrance, max_occupants, amenities, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      parseInt(id),
      unitName,
      description || null,
      rentAmount || null,
      depositAmount || null,
      isFurnished || false,
      hasOwnBathroom || false,
      hasOwnEntrance || false,
      maxOccupants || 1,
      JSON.stringify(amenities || []),
      JSON.stringify(images || []),
    ]
  );

  // Update property to mark as multi-unit
  await query(
    `UPDATE properties 
     SET is_multi_unit = true, 
         total_units = (SELECT COUNT(*) FROM property_units WHERE property_id = $1)
     WHERE id = $1`,
    [parseInt(id)]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
