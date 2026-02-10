import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST /api/disputes/[id]/messages - Add message to dispute
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
  const { content, is_internal = false } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';

  // Get dispute
  const dispute = await query(`SELECT * FROM disputes WHERE id = $1`, [id]);
  if (dispute.rows.length === 0) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  // Only admin or reporter can add messages
  const isReporter = dispute.rows[0].reporter_id === parseInt(session.user.id);
  if (!isAdmin && !isReporter) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Only admins can add internal notes
  const internal = isAdmin ? is_internal : false;

  const result = await query(
    `INSERT INTO dispute_messages (dispute_id, sender_id, content, is_internal)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, session.user.id, content.trim(), internal]
  );

  // Get sender name
  const sender = await query(`SELECT name FROM users WHERE id = $1`, [session.user.id]);
  const message = {
    ...result.rows[0],
    sender_name: sender.rows[0]?.name,
  };

  // If dispute was resolved/dismissed and there's a new message, reopen it
  if (dispute.rows[0].status === 'resolved' || dispute.rows[0].status === 'dismissed') {
    await query(
      `UPDATE disputes SET status = 'investigating', updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  return NextResponse.json({ message }, { status: 201 });
}
