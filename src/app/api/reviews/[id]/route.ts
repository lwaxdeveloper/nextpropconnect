import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/reviews/[id] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const result = await query(
    `SELECT 
      r.*,
      u.name as reviewer_name,
      u.avatar_url as reviewer_avatar,
      p.title as property_title,
      p.suburb as property_suburb,
      rr.id as response_id,
      rr.content as response_content,
      rr.created_at as response_created_at
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN review_responses rr ON r.id = rr.review_id
    WHERE r.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const row = result.rows[0];
  const review = {
    ...row,
    response: row.response_id ? {
      id: row.response_id,
      content: row.response_content,
      created_at: row.response_created_at,
    } : null,
  };

  return NextResponse.json({ review });
}

// PATCH /api/reviews/[id] - Update review (owner) or moderate (admin)
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

  // Get the review
  const existing = await query(
    `SELECT * FROM reviews WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const review = existing.rows[0];
  const isOwner = review.reviewer_id === parseInt(session.user.id);
  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to edit this review' }, { status: 403 });
  }

  // Owner can update content
  if (isOwner && (body.rating || body.title || body.content)) {
    await query(
      `UPDATE reviews SET 
        rating = COALESCE($1, rating),
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        updated_at = NOW()
      WHERE id = $4`,
      [body.rating || null, body.title || null, body.content || null, id]
    );
  }

  // Admin can moderate
  if (isAdmin && body.status) {
    await query(
      `UPDATE reviews SET 
        status = $1,
        moderation_note = $2,
        moderated_by = $3,
        moderated_at = NOW(),
        updated_at = NOW()
      WHERE id = $4`,
      [body.status, body.moderation_note || null, session.user.id, id]
    );
  }

  // Get updated review
  const updated = await query(`SELECT * FROM reviews WHERE id = $1`, [id]);
  return NextResponse.json({ review: updated.rows[0] });
}

// DELETE /api/reviews/[id] - Delete review (owner or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await query(
    `SELECT * FROM reviews WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const review = existing.rows[0];
  const isOwner = review.reviewer_id === parseInt(session.user.id);
  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to delete this review' }, { status: 403 });
  }

  await query(`DELETE FROM reviews WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
