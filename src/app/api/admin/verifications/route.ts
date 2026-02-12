import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/admin/verifications - List all verification requests
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const adminCheck = await query(
    'SELECT role FROM users WHERE id = $1',
    [parseInt(session.user.id)]
  );
  
  if (adminCheck.rows[0]?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const type = searchParams.get('type');

  let whereClause = 'WHERE v.status = $1';
  const params: (string | number)[] = [status];

  if (type) {
    whereClause += ` AND v.type = $${params.length + 1}`;
    params.push(type);
  }

  const result = await query(
    `SELECT 
      v.*,
      u.name as user_name,
      u.email as user_email,
      u.avatar_url as user_avatar,
      u.role as user_role,
      p.title as property_title,
      p.address as property_address,
      p.images as property_images,
      reviewer.name as reviewer_name
     FROM verifications v
     JOIN users u ON v.user_id = u.id
     LEFT JOIN properties p ON v.property_id = p.id
     LEFT JOIN users reviewer ON v.reviewed_by = reviewer.id
     ${whereClause}
     ORDER BY v.submitted_at ASC`,
    params
  );

  // Get counts by status
  const countsResult = await query(
    `SELECT status, COUNT(*) as count FROM verifications GROUP BY status`
  );

  const counts = countsResult.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count);
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    verifications: result.rows,
    counts,
  });
}
