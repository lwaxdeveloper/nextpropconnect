import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/reviews - List reviews (for an agent, by a user, or all pending for admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');
  const reviewerId = searchParams.get('reviewer_id');
  const propertyId = searchParams.get('property_id');
  const status = searchParams.get('status') || 'approved';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let sql = `
    SELECT 
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
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramCount = 0;

  if (agentId) {
    paramCount++;
    sql += ` AND r.agent_id = $${paramCount}`;
    params.push(parseInt(agentId));
  }

  if (reviewerId) {
    paramCount++;
    sql += ` AND r.reviewer_id = $${paramCount}`;
    params.push(parseInt(reviewerId));
  }

  if (propertyId) {
    paramCount++;
    sql += ` AND r.property_id = $${paramCount}`;
    params.push(parseInt(propertyId));
  }

  if (status !== 'all') {
    paramCount++;
    sql += ` AND r.status = $${paramCount}`;
    params.push(status);
  }

  sql += ` ORDER BY r.created_at DESC`;
  
  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(limit);
  
  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const result = await query(sql, params);

  // Transform response into nested structure
  const reviews = result.rows.map(row => ({
    id: row.id,
    agent_id: row.agent_id,
    reviewer_id: row.reviewer_id,
    property_id: row.property_id,
    lead_id: row.lead_id,
    rating: row.rating,
    title: row.title,
    content: row.content,
    transaction_type: row.transaction_type,
    is_verified_transaction: row.is_verified_transaction,
    verified_at: row.verified_at,
    status: row.status,
    helpful_count: row.helpful_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reviewer_name: row.reviewer_name,
    reviewer_avatar: row.reviewer_avatar,
    property_title: row.property_title,
    property_suburb: row.property_suburb,
    response: row.response_id ? {
      id: row.response_id,
      content: row.response_content,
      created_at: row.response_created_at,
    } : null,
  }));

  return NextResponse.json({ reviews });
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    agent_id, 
    property_id, 
    lead_id,
    rating, 
    title, 
    content, 
    transaction_type = 'sale' 
  } = body;

  // Validation
  if (!agent_id || !rating) {
    return NextResponse.json({ error: 'agent_id and rating are required' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  // Can't review yourself
  if (parseInt(agent_id) === parseInt(session.user.id)) {
    return NextResponse.json({ error: 'You cannot review yourself' }, { status: 400 });
  }

  // Check if user already reviewed this agent for this property
  const existing = await query(
    `SELECT id FROM reviews WHERE reviewer_id = $1 AND agent_id = $2 AND ($3::int IS NULL OR property_id = $3)`,
    [session.user.id, agent_id, property_id || null]
  );

  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'You have already reviewed this agent' }, { status: 400 });
  }

  // Check for verified transaction (if there's a completed lead)
  let isVerified = false;
  if (lead_id) {
    const lead = await query(
      `SELECT id FROM leads WHERE id = $1 AND agent_id = $2 AND status = 'won'`,
      [lead_id, agent_id]
    );
    isVerified = lead.rows.length > 0;
  }

  // Create the review
  const result = await query(
    `INSERT INTO reviews (
      agent_id, reviewer_id, property_id, lead_id, 
      rating, title, content, transaction_type,
      is_verified_transaction, verified_at, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      agent_id,
      session.user.id,
      property_id || null,
      lead_id || null,
      rating,
      title || null,
      content || null,
      transaction_type,
      isVerified,
      isVerified ? new Date().toISOString() : null,
      'approved', // Auto-approve for now, could be 'pending' for moderation
    ]
  );

  return NextResponse.json({ review: result.rows[0] }, { status: 201 });
}
