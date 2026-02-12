import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/roommates/[id] - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await query(
    `SELECT rl.*, 
      u.name as user_name,
      u.avatar_url as user_avatar,
      u.identity_verified as user_verified,
      u.email as user_email,
      p.title as property_title,
      p.address as property_address,
      p.images as property_images
     FROM roommate_listings rl
     JOIN users u ON rl.user_id = u.id
     LEFT JOIN properties p ON rl.property_id = p.id
     WHERE rl.id = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Get inquiry count
  const inquiriesResult = await query(
    'SELECT COUNT(*) as count FROM roommate_inquiries WHERE listing_id = $1',
    [parseInt(id)]
  );

  return NextResponse.json({
    ...result.rows[0],
    inquiry_count: parseInt(inquiriesResult.rows[0].count),
  });
}

// PATCH /api/roommates/[id] - Update listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Verify ownership
  const listingCheck = await query(
    'SELECT id FROM roommate_listings WHERE id = $1 AND user_id = $2',
    [parseInt(id), userId]
  );

  if (listingCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const updates: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramCount = 0;

  const fields = [
    'title', 'description', 'area', 'city', 'province',
    'rent_amount', 'deposit_amount', 'available_from',
    'is_furnished', 'has_own_bathroom',
    'budget_min', 'budget_max', 'move_in_date',
    'preferred_gender', 'preferred_age_min', 'preferred_age_max',
    'smoker_friendly', 'pet_friendly', 'couples_ok',
    'my_age', 'my_gender', 'my_occupation', 'about_me', 'lifestyle', 'status',
  ];

  for (const field of fields) {
    const camelCase = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (body[camelCase] !== undefined) {
      updates.push(`${field} = $${++paramCount}`);
      values.push(body[camelCase]);
    }
  }

  if (body.images !== undefined) {
    updates.push(`images = $${++paramCount}`);
    values.push(JSON.stringify(body.images));
  }

  updates.push('updated_at = NOW()');

  if (updates.length === 1) { // Only updated_at
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(parseInt(id));

  const result = await query(
    `UPDATE roommate_listings SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

// DELETE /api/roommates/[id] - Delete listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Verify ownership
  const listingCheck = await query(
    'SELECT id FROM roommate_listings WHERE id = $1 AND user_id = $2',
    [parseInt(id), userId]
  );

  if (listingCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  await query('DELETE FROM roommate_listings WHERE id = $1', [parseInt(id)]);

  return NextResponse.json({ success: true });
}
