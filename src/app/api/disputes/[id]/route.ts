import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/disputes/[id] - Get dispute details with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';

  // Get dispute
  const result = await query(
    `SELECT 
      d.*,
      reporter.name as reporter_name,
      reporter.email as reporter_email,
      reported.name as reported_user_name,
      reported.email as reported_user_email,
      p.title as reported_property_title,
      r.content as reported_review_content
    FROM disputes d
    JOIN users reporter ON d.reporter_id = reporter.id
    LEFT JOIN users reported ON d.reported_user_id = reported.id
    LEFT JOIN properties p ON d.reported_property_id = p.id
    LEFT JOIN reviews r ON d.reported_review_id = r.id
    WHERE d.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  const dispute = result.rows[0];

  // Non-admins can only view their own disputes
  if (!isAdmin && dispute.reporter_id !== parseInt(session.user.id)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Get messages (non-internal for regular users)
  const messagesQuery = isAdmin
    ? `SELECT dm.*, u.name as sender_name FROM dispute_messages dm 
       JOIN users u ON dm.sender_id = u.id 
       WHERE dm.dispute_id = $1 ORDER BY dm.created_at ASC`
    : `SELECT dm.*, u.name as sender_name FROM dispute_messages dm 
       JOIN users u ON dm.sender_id = u.id 
       WHERE dm.dispute_id = $1 AND dm.is_internal = false ORDER BY dm.created_at ASC`;
  
  const messages = await query(messagesQuery, [id]);

  return NextResponse.json({ 
    dispute,
    messages: messages.rows,
  });
}

// PATCH /api/disputes/[id] - Update dispute (admin only for status changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';
  const body = await request.json();

  // Get dispute
  const existing = await query(`SELECT * FROM disputes WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  const dispute = existing.rows[0];
  const isReporter = dispute.reporter_id === parseInt(session.user.id);

  // Reporter can add evidence
  if (isReporter && body.evidence_urls) {
    await query(
      `UPDATE disputes SET evidence_urls = $1, updated_at = NOW() WHERE id = $2`,
      [body.evidence_urls, id]
    );
  }

  // Admin actions
  if (isAdmin) {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let valueCount = 0;

    if (body.status) {
      valueCount++;
      updates.push(`status = $${valueCount}`);
      values.push(body.status);

      if (body.status === 'resolved' || body.status === 'dismissed') {
        valueCount++;
        updates.push(`resolved_by = $${valueCount}`);
        values.push(session.user.id);
        updates.push(`resolved_at = NOW()`);
      }
    }

    if (body.resolution) {
      valueCount++;
      updates.push(`resolution = $${valueCount}`);
      values.push(body.resolution);
    }

    if (body.assigned_to !== undefined) {
      valueCount++;
      updates.push(`assigned_to = $${valueCount}`);
      values.push(body.assigned_to);
      updates.push(`assigned_at = NOW()`);
    }

    if (body.priority !== undefined) {
      valueCount++;
      updates.push(`priority = $${valueCount}`);
      values.push(body.priority);
    }

    if (updates.length > 0) {
      valueCount++;
      values.push(id);
      await query(
        `UPDATE disputes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${valueCount}`,
        values
      );
    }
  }

  // Get updated dispute
  const updated = await query(`SELECT * FROM disputes WHERE id = $1`, [id]);
  return NextResponse.json({ dispute: updated.rows[0] });
}
