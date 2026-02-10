import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST /api/reviews/[id]/vote - Vote review as helpful/not helpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { is_helpful } = body;

  if (typeof is_helpful !== 'boolean') {
    return NextResponse.json({ error: 'is_helpful must be a boolean' }, { status: 400 });
  }

  // Check review exists
  const review = await query(`SELECT id FROM reviews WHERE id = $1`, [id]);
  if (review.rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // Upsert vote
  await query(
    `INSERT INTO review_votes (review_id, user_id, is_helpful)
     VALUES ($1, $2, $3)
     ON CONFLICT (review_id, user_id) 
     DO UPDATE SET is_helpful = $3`,
    [id, session.user.id, is_helpful]
  );

  // Update helpful count on review
  const countResult = await query(
    `SELECT COUNT(*) as count FROM review_votes WHERE review_id = $1 AND is_helpful = true`,
    [id]
  );
  
  await query(
    `UPDATE reviews SET helpful_count = $1 WHERE id = $2`,
    [countResult.rows[0].count, id]
  );

  return NextResponse.json({ 
    success: true, 
    helpful_count: parseInt(countResult.rows[0].count) 
  });
}

// DELETE /api/reviews/[id]/vote - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await query(
    `DELETE FROM review_votes WHERE review_id = $1 AND user_id = $2`,
    [id, session.user.id]
  );

  // Update helpful count
  const countResult = await query(
    `SELECT COUNT(*) as count FROM review_votes WHERE review_id = $1 AND is_helpful = true`,
    [id]
  );
  
  await query(
    `UPDATE reviews SET helpful_count = $1 WHERE id = $2`,
    [countResult.rows[0].count, id]
  );

  return NextResponse.json({ 
    success: true, 
    helpful_count: parseInt(countResult.rows[0].count) 
  });
}
