import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';
import { DISPUTE_CATEGORIES } from '@/types/reviews';

// GET /api/disputes - List disputes (admin: all, user: own)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const user = session.user as { id?: string; role?: string };
  const isAdmin = user.role === 'admin';

  let sql = `
    SELECT 
      d.*,
      reporter.name as reporter_name,
      reported.name as reported_user_name,
      p.title as reported_property_title
    FROM disputes d
    JOIN users reporter ON d.reporter_id = reporter.id
    LEFT JOIN users reported ON d.reported_user_id = reported.id
    LEFT JOIN properties p ON d.reported_property_id = p.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramCount = 0;

  // Non-admins can only see their own disputes
  if (!isAdmin) {
    paramCount++;
    sql += ` AND d.reporter_id = $${paramCount}`;
    params.push(parseInt(session.user.id));
  }

  if (status) {
    paramCount++;
    sql += ` AND d.status = $${paramCount}`;
    params.push(status);
  }

  if (category) {
    paramCount++;
    sql += ` AND d.category = $${paramCount}`;
    params.push(category);
  }

  sql += ` ORDER BY d.priority DESC, d.created_at DESC`;
  
  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(limit);
  
  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const result = await query(sql, params);

  // Get counts by status for admin dashboard
  let counts = null;
  if (isAdmin) {
    const countsResult = await query(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM disputes 
      GROUP BY status
    `);
    counts = {
      open: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0,
    };
    for (const row of countsResult.rows) {
      counts[row.status as keyof typeof counts] = parseInt(row.count);
    }
  }

  return NextResponse.json({ 
    disputes: result.rows,
    counts,
  });
}

// POST /api/disputes - Create a new dispute
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    reported_user_id,
    reported_property_id,
    reported_review_id,
    category,
    title,
    description,
    evidence_urls,
  } = body;

  // Validation
  if (!category || !title || !description) {
    return NextResponse.json({ 
      error: 'category, title, and description are required' 
    }, { status: 400 });
  }

  if (!DISPUTE_CATEGORIES[category as keyof typeof DISPUTE_CATEGORIES]) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  // At least one target required
  if (!reported_user_id && !reported_property_id && !reported_review_id) {
    return NextResponse.json({ 
      error: 'Must report a user, property, or review' 
    }, { status: 400 });
  }

  // Get severity from category
  const categoryInfo = DISPUTE_CATEGORIES[category as keyof typeof DISPUTE_CATEGORIES];
  const severity = categoryInfo.severity;

  // Calculate priority (0-100)
  // Higher for critical severity, lower for low
  const priorityMap: Record<string, number> = {
    critical: 90,
    high: 70,
    medium: 50,
    low: 30,
  };
  const priority = priorityMap[severity] || 50;

  const result = await query(
    `INSERT INTO disputes (
      reporter_id, reported_user_id, reported_property_id, reported_review_id,
      category, severity, title, description, evidence_urls, priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      session.user.id,
      reported_user_id || null,
      reported_property_id || null,
      reported_review_id || null,
      category,
      severity,
      title,
      description,
      evidence_urls || null,
      priority,
    ]
  );

  return NextResponse.json({ dispute: result.rows[0] }, { status: 201 });
}
