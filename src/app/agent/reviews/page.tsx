import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { ReviewCard, TrustScoreCard } from '@/components/reviews';
import { Star } from 'lucide-react';
import type { Review } from '@/types/reviews';

export const dynamic = 'force-dynamic';

async function getAgentReviews(agentId: number) {
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
    WHERE r.agent_id = $1 AND r.status = 'approved'
    ORDER BY r.created_at DESC`,
    [agentId]
  );

  return result.rows.map(row => ({
    ...row,
    response: row.response_id ? {
      id: row.response_id,
      content: row.response_content,
      created_at: row.response_created_at,
    } : null,
  })) as Review[];
}

async function getAgentStats(agentId: number) {
  // Get review stats
  const reviewStats = await query(
    `SELECT 
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(*) FILTER (WHERE is_verified_transaction = true) as verified_reviews
    FROM reviews 
    WHERE agent_id = $1 AND status = 'approved'`,
    [agentId]
  );

  // Get rating distribution
  const distribution = await query(
    `SELECT rating, COUNT(*) as count
     FROM reviews 
     WHERE agent_id = $1 AND status = 'approved'
     GROUP BY rating
     ORDER BY rating`,
    [agentId]
  );

  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distribution.rows) {
    ratingDist[row.rating as 1 | 2 | 3 | 4 | 5] = parseInt(row.count);
  }

  // Get agent profile
  const profile = await query(
    `SELECT * FROM agent_profiles WHERE user_id = $1`,
    [agentId]
  );

  const stats = reviewStats.rows[0];
  const agentProfile = profile.rows[0] || {};

  return {
    totalReviews: parseInt(stats.total_reviews),
    averageRating: parseFloat(stats.average_rating).toFixed(1),
    verifiedReviews: parseInt(stats.verified_reviews),
    ratingDistribution: ratingDist,
    trustScore: agentProfile.trust_score || 50,
    responseRate: agentProfile.response_rate || 0,
    avgResponseTime: agentProfile.avg_response_time_hours,
    completedTransactions: agentProfile.completed_transactions || 0,
    isVerified: agentProfile.is_verified || false,
  };
}

export default async function AgentReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const agentId = parseInt(session.user.id);
  const [reviews, stats] = await Promise.all([
    getAgentReviews(agentId),
    getAgentStats(agentId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600">
          See what clients are saying about you
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="space-y-6">
          {/* Trust Score Card */}
          <TrustScoreCard
            score={stats.trustScore}
            totalReviews={stats.totalReviews}
            averageRating={parseFloat(stats.averageRating)}
            responseRate={stats.responseRate}
            avgResponseTime={stats.avgResponseTime}
            completedTransactions={stats.completedTransactions}
            isVerified={stats.isVerified}
          />

          {/* Rating Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5];
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-4">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Boost Your Score</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Respond to all inquiries within 24 hours</li>
              <li>• Ask satisfied clients to leave reviews</li>
              <li>• Reply professionally to all reviews</li>
              <li>• Complete more transactions</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Complete transactions and provide great service to start receiving reviews from your clients.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isAgentView={true}
                onRespond={(id) => {
                  // This would open a modal in a client component
                  console.log('Respond to review', id);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
