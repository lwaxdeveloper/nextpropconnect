import { notFound } from "next/navigation";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyGrid from "@/components/PropertyGrid";
import AgentChatButton from "./AgentChatButton";
import { query } from "@/lib/db";
import { TrustScoreCard, ReviewCard } from "@/components/reviews";
import { Star } from "lucide-react";
import type { Review } from "@/types/reviews";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getAgent(id: number) {
  const result = await query(
    `SELECT ap.*, u.name, u.avatar_url, u.phone, u.email
    FROM agent_profiles ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;

  const listings = await query(
    `SELECT p.*,
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
    FROM properties p
    WHERE p.agent_id = $1 AND p.status = 'active'
    ORDER BY p.is_featured DESC, p.created_at DESC`,
    [id]
  );

  // Get reviews
  const reviewsResult = await query(
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
    ORDER BY r.created_at DESC
    LIMIT 5`,
    [result.rows[0].user_id]
  );

  const reviews: Review[] = reviewsResult.rows.map(row => ({
    ...row,
    response: row.response_id ? {
      id: row.response_id,
      content: row.response_content,
      created_at: row.response_created_at,
    } : null,
  }));

  // Get review stats
  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 0) as average_rating
    FROM reviews 
    WHERE agent_id = $1 AND status = 'approved'`,
    [result.rows[0].user_id]
  );

  const reviewStats = {
    totalReviews: parseInt(statsResult.rows[0].total_reviews),
    averageRating: parseFloat(statsResult.rows[0].average_rating),
  };

  return { agent: result.rows[0], listings: listings.rows, reviews, reviewStats };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agentId = parseInt(id);
  if (isNaN(agentId)) return { title: "Agent Not Found" };

  const result = await query(
    `SELECT ap.agency_name, u.name FROM agent_profiles ap JOIN users u ON ap.user_id = u.id WHERE ap.id = $1`,
    [agentId]
  );
  if (result.rows.length === 0) return { title: "Agent Not Found" };

  const a = result.rows[0];
  return {
    title: `${a.name} — ${a.agency_name || "Agent"} | NextPropConnect SA`,
    description: `View ${a.name}'s profile and listings on NextPropConnect SA.`,
  };
}

export default async function AgentProfilePage({ params }: Props) {
  const { id } = await params;
  const agentId = parseInt(id);
  if (isNaN(agentId)) notFound();

  const data = await getAgent(agentId);
  if (!data) notFound();

  const { agent: a, listings, reviews, reviewStats } = data;

  const trustColor =
    a.trust_score >= 80
      ? "text-green-600 bg-green-50"
      : a.trust_score >= 50
      ? "text-yellow-600 bg-yellow-50"
      : "text-red-600 bg-red-50";

  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Agent Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {a.avatar_url ? (
                  <img
                    src={a.avatar_url}
                    alt={a.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                    {a.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl font-black text-dark">{a.name}</h1>
                  {a.is_verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                      ✓ Verified Agent
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${trustColor}`}
                  >
                    Trust Score: {a.trust_score}/100
                  </span>
                </div>

                {a.agency_name && (
                  <p className="text-gray-600 mb-2">{a.agency_name}</p>
                )}

                {a.bio && (
                  <p className="text-sm text-gray-500 mb-4 whitespace-pre-line">
                    {a.bio}
                  </p>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {a.eaab_number && (
                    <div>
                      <span className="text-gray-400 block text-xs">EAAB Number</span>
                      <span className="font-medium text-dark">{a.eaab_number}</span>
                    </div>
                  )}
                  {a.ffc_number && (
                    <div>
                      <span className="text-gray-400 block text-xs">FFC Number</span>
                      <span className="font-medium text-dark">{a.ffc_number}</span>
                    </div>
                  )}
                  {a.years_experience && (
                    <div>
                      <span className="text-gray-400 block text-xs">Experience</span>
                      <span className="font-medium text-dark">{a.years_experience} years</span>
                    </div>
                  )}
                  {a.commission_rate && (
                    <div>
                      <span className="text-gray-400 block text-xs">Commission</span>
                      <span className="font-medium text-dark">{Number(a.commission_rate)}%</span>
                    </div>
                  )}
                </div>

                {/* Areas & Specializations */}
                <div className="mt-4 flex flex-wrap gap-4">
                  {a.areas_served && a.areas_served.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Areas Served</span>
                      <div className="flex flex-wrap gap-1">
                        {a.areas_served.map((area: string) => (
                          <span
                            key={area}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {a.specializations && a.specializations.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Specializations</span>
                      <div className="flex flex-wrap gap-1">
                        {a.specializations.map((s: string) => (
                          <span
                            key={s}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  {a.phone && (
                    <span className="text-sm text-gray-600">📱 {a.phone}</span>
                  )}
                  <AgentChatButton agentUserId={a.user_id} agentPhone={a.phone} agentName={a.name} />
                </div>
              </div>
            </div>
          </div>

          {/* Listings */}
          <h2 className="text-xl font-bold text-dark mb-6">
            Active Listings ({listings.length})
          </h2>
          <PropertyGrid properties={listings} />

          {/* Reviews Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Reviews ({reviewStats.totalReviews})
              </h2>
              {reviewStats.totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(reviewStats.averageRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Trust Score Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <TrustScoreCard
                score={a.trust_score || 50}
                totalReviews={reviewStats.totalReviews}
                averageRating={reviewStats.averageRating}
                responseRate={a.response_rate || 0}
                avgResponseTime={a.avg_response_time_hours}
                completedTransactions={a.completed_transactions || 0}
                isVerified={a.is_verified}
              />

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {reviews.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Reviews Yet
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Be the first to review this agent after working with them.
                    </p>
                  </div>
                ) : (
                  <>
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                    {reviewStats.totalReviews > 5 && (
                      <Link
                        href={`/agents/${agentId}/reviews`}
                        className="block text-center text-blue-600 hover:text-blue-700 font-medium py-3"
                      >
                        View all {reviewStats.totalReviews} reviews →
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
