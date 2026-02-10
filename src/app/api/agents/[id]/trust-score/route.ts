import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/agents/[id]/trust-score - Get trust score breakdown
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get agent profile
  const profileResult = await query(
    `SELECT 
      ap.*,
      u.name,
      u.avatar_url
    FROM agent_profiles ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.user_id = $1`,
    [id]
  );

  if (profileResult.rows.length === 0) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const profile = profileResult.rows[0];

  // Get review stats
  const reviewStats = await query(
    `SELECT 
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(*) FILTER (WHERE is_verified_transaction = true) as verified_reviews
    FROM reviews 
    WHERE agent_id = $1 AND status = 'approved'`,
    [id]
  );

  // Get recent disputes against this agent
  const disputeCount = await query(
    `SELECT COUNT(*) as count
     FROM disputes 
     WHERE reported_user_id = $1 
       AND status = 'resolved' 
       AND resolved_at > NOW() - INTERVAL '1 year'`,
    [id]
  );

  // Calculate score breakdown
  const stats = reviewStats.rows[0];
  const reviewCount = parseInt(stats.total_reviews);
  const avgRating = parseFloat(stats.average_rating);
  const disputes = parseInt(disputeCount.rows[0].count);

  // Rating score (max 40 points)
  let ratingScore = reviewCount > 0 ? avgRating * 8 : 20;
  ratingScore += Math.min(reviewCount * 0.2, 10); // Bonus for more reviews

  // Response score (max 25 points)
  const responseScore = (profile.response_rate || 50) * 0.25;

  // Completion score (max 20 points)
  const completionScore = Math.min((profile.completed_transactions || 0) * 0.5, 20);

  // Dispute penalty (max 15 points)
  const disputePenalty = Math.min(disputes * 3, 15);

  // Total score
  const totalScore = Math.max(0, Math.min(100, 
    Math.round(ratingScore + responseScore + completionScore - disputePenalty)
  ));

  // Get score history
  const history = await query(
    `SELECT * FROM trust_score_history 
     WHERE agent_id = $1 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [id]
  );

  return NextResponse.json({
    trust_profile: {
      user_id: parseInt(id),
      name: profile.name,
      avatar_url: profile.avatar_url,
      agency_name: profile.agency_name,
      trust_score: totalScore,
      total_reviews: reviewCount,
      average_rating: avgRating.toFixed(1),
      verified_reviews: parseInt(stats.verified_reviews),
      response_rate: profile.response_rate || 0,
      avg_response_time_hours: profile.avg_response_time_hours,
      completed_transactions: profile.completed_transactions || 0,
      is_verified: profile.is_verified,
      years_experience: profile.years_experience,
      areas_served: profile.areas_served,
    },
    breakdown: {
      total: totalScore,
      rating_score: Math.round(ratingScore),
      response_score: Math.round(responseScore),
      completion_score: Math.round(completionScore),
      dispute_penalty: disputePenalty,
      review_count: reviewCount,
    },
    history: history.rows,
  });
}

// POST /api/agents/[id]/trust-score - Recalculate trust score (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Call the database function to recalculate
  const result = await query(
    `SELECT calculate_trust_score($1) as new_score`,
    [id]
  );

  return NextResponse.json({ 
    new_score: result.rows[0].new_score 
  });
}
