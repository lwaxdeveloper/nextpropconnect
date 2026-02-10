import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";
import Logo from "@/components/Logo";
import { AlertTriangle, Star, Flag, CheckCircle, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getModerationStats() {
  // Get pending reviews
  const pendingReviews = await query(
    `SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'`
  );

  // Get flagged reviews
  const flaggedReviews = await query(
    `SELECT COUNT(*) as count FROM reviews WHERE status = 'flagged'`
  );

  // Get open disputes
  const openDisputes = await query(
    `SELECT COUNT(*) as count FROM disputes WHERE status = 'open'`
  );

  // Get investigating disputes
  const investigatingDisputes = await query(
    `SELECT COUNT(*) as count FROM disputes WHERE status = 'investigating'`
  );

  return {
    pendingReviews: parseInt(pendingReviews.rows[0].count),
    flaggedReviews: parseInt(flaggedReviews.rows[0].count),
    openDisputes: parseInt(openDisputes.rows[0].count),
    investigatingDisputes: parseInt(investigatingDisputes.rows[0].count),
  };
}

async function getRecentReviews() {
  const result = await query(
    `SELECT 
      r.*,
      reviewer.name as reviewer_name,
      agent.name as agent_name,
      p.title as property_title
    FROM reviews r
    JOIN users reviewer ON r.reviewer_id = reviewer.id
    JOIN users agent ON r.agent_id = agent.id
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE r.status IN ('pending', 'flagged')
    ORDER BY 
      CASE r.status WHEN 'flagged' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
      r.created_at DESC
    LIMIT 20`
  );
  return result.rows;
}

async function getRecentDisputes() {
  const result = await query(
    `SELECT 
      d.*,
      reporter.name as reporter_name,
      reported.name as reported_user_name,
      p.title as property_title
    FROM disputes d
    JOIN users reporter ON d.reporter_id = reporter.id
    LEFT JOIN users reported ON d.reported_user_id = reported.id
    LEFT JOIN properties p ON d.reported_property_id = p.id
    WHERE d.status IN ('open', 'investigating')
    ORDER BY d.priority DESC, d.created_at DESC
    LIMIT 20`
  );
  return result.rows;
}

export default async function ModerationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string };
  if (user.role !== "admin") redirect("/dashboard");

  const [stats, reviews, disputes] = await Promise.all([
    getModerationStats(),
    getRecentReviews(),
    getRecentDisputes(),
  ]);

  const severityColors = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">Moderation Queue</h1>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
                <p className="text-sm text-gray-500">Pending Reviews</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.flaggedReviews}</p>
                <p className="text-sm text-gray-500">Flagged Reviews</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.openDisputes}</p>
                <p className="text-sm text-gray-500">Open Disputes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.investigatingDisputes}</p>
                <p className="text-sm text-gray-500">Investigating</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reviews Queue */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Reviews to Moderate
            </h2>
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  All caught up! No reviews need moderation.
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.reviewer_name} → {review.agent_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {review.property_title || "General review"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          review.status === 'flagged' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {review.status}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.content && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {review.content}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <form action={`/api/reviews/${review.id}`} method="POST">
                        <input type="hidden" name="status" value="approved" />
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={`/api/reviews/${review.id}`} method="POST">
                        <input type="hidden" name="status" value="rejected" />
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </form>
                      <Link
                        href={`/admin/moderation/reviews/${review.id}`}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Disputes Queue */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Disputes to Review
            </h2>
            <div className="space-y-3">
              {disputes.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  All caught up! No disputes need attention.
                </div>
              ) : (
                disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{dispute.title}</p>
                        <p className="text-sm text-gray-500">
                          by {dispute.reporter_name}
                          {dispute.reported_user_name && ` against ${dispute.reported_user_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          severityColors[dispute.severity as keyof typeof severityColors]
                        }`}>
                          {dispute.severity}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          dispute.status === 'open' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {dispute.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {dispute.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Priority: {dispute.priority}/100
                      </span>
                      <Link
                        href={`/admin/moderation/disputes/${dispute.id}`}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Investigate →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
