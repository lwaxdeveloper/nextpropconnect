import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST /api/reviews/[id]/respond - Agent responds to a review
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
  const { content } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Response content is required' }, { status: 400 });
  }

  // Get the review and verify this user is the agent being reviewed
  const review = await query(
    `SELECT * FROM reviews WHERE id = $1`,
    [id]
  );

  if (review.rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  if (review.rows[0].agent_id !== parseInt(session.user.id)) {
    return NextResponse.json({ error: 'Only the reviewed agent can respond' }, { status: 403 });
  }

  // Check if response already exists
  const existing = await query(
    `SELECT id FROM review_responses WHERE review_id = $1`,
    [id]
  );

  if (existing.rows.length > 0) {
    // Update existing response
    const result = await query(
      `UPDATE review_responses SET content = $1, updated_at = NOW() WHERE review_id = $2 RETURNING *`,
      [content.trim(), id]
    );
    return NextResponse.json({ response: result.rows[0] });
  }

  // Create new response
  const result = await query(
    `INSERT INTO review_responses (review_id, agent_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [id, session.user.id, content.trim()]
  );

  return NextResponse.json({ response: result.rows[0] }, { status: 201 });
}

// DELETE /api/reviews/[id]/respond - Delete response
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get the review
  const review = await query(
    `SELECT * FROM reviews WHERE id = $1`,
    [id]
  );

  if (review.rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const isAgent = review.rows[0].agent_id === parseInt(session.user.id);
  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';

  if (!isAgent && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  await query(`DELETE FROM review_responses WHERE review_id = $1`, [id]);
  return NextResponse.json({ success: true });
}
