import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/reviews/stats?agent_id=X - Get review statistics for an agent
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');

  if (!agentId) {
    return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
  }

  // Get overall stats
  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(*) FILTER (WHERE is_verified_transaction = true) as verified_count
    FROM reviews 
    WHERE agent_id = $1 AND status = 'approved'`,
    [agentId]
  );

  // Get rating distribution
  const distributionResult = await query(
    `SELECT rating, COUNT(*) as count
     FROM reviews 
     WHERE agent_id = $1 AND status = 'approved'
     GROUP BY rating
     ORDER BY rating`,
    [agentId]
  );

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distributionResult.rows) {
    distribution[row.rating as 1 | 2 | 3 | 4 | 5] = parseInt(row.count);
  }

  const stats = statsResult.rows[0];

  return NextResponse.json({
    stats: {
      total_reviews: parseInt(stats.total_reviews),
      average_rating: parseFloat(stats.average_rating).toFixed(1),
      rating_distribution: distribution,
      verified_count: parseInt(stats.verified_count),
    }
  });
}
