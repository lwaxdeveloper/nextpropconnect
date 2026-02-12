import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import AgentDashboardClient from "./AgentDashboardClient";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await auth();
  const user = session!.user as { id?: string; name?: string; email?: string; role?: string };
  const userId = parseInt(user.id || "0");

  // Active listings count
  const listingsResult = await query(
    `SELECT COUNT(*)::int as count FROM properties WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
  const activeListings = listingsResult.rows[0].count;

  // Total views this month
  const viewsResult = await query(
    `SELECT COALESCE(SUM(views_count), 0)::int as total FROM properties WHERE user_id = $1 AND status != 'deleted'`,
    [userId]
  );
  const totalViews = viewsResult.rows[0].total;

  // Open leads
  const leadsResult = await query(
    `SELECT 
       COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE status NOT IN ('won', 'lost'))::int as open_count
     FROM leads WHERE agent_id = $1`,
    [userId]
  );
  const openLeads = leadsResult.rows[0].open_count;

  // Unread messages
  const unreadResult = await query(
    `SELECT COUNT(*)::int as count FROM messages m 
     JOIN conversations c ON m.conversation_id = c.id 
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id != $1 AND m.is_read = FALSE`,
    [userId]
  );
  const unreadMessages = unreadResult.rows[0].count;

  // All leads for pipeline
  const allLeadsResult = await query(
    `SELECT l.*, p.title as property_title, p.price as property_price, p.suburb, p.city
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.agent_id = $1
     ORDER BY l.updated_at DESC`,
    [userId]
  );

  // My listings with stats
  const myListingsResult = await query(
    `SELECT p.*, 
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
     FROM properties p
     WHERE p.user_id = $1 AND p.status != 'deleted'
     ORDER BY p.views_count DESC
     LIMIT 8`,
    [userId]
  );

  // Recent conversations
  const conversationsResult = await query(
    `SELECT c.id, c.last_message_at as updated_at,
       CASE WHEN c.buyer_id = $1 THEN su.name ELSE bu.name END as other_name,
       p.title as property_title,
       (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
       (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
     FROM conversations c
     JOIN users bu ON c.buyer_id = bu.id
     JOIN users su ON c.seller_id = su.id
     LEFT JOIN properties p ON c.property_id = p.id
     WHERE c.buyer_id = $1 OR c.seller_id = $1
     ORDER BY c.last_message_at DESC
     LIMIT 5`,
    [userId]
  );

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark">
            Welcome, {user.name || "Agent"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your CRM overview</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/agent/leads"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-dark text-white font-semibold rounded-xl hover:bg-gray-800 transition text-sm"
          >
            👥 All Leads
          </Link>
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm"
          >
            ➕ New Listing
          </Link>
        </div>
      </div>

      <AgentDashboardClient
        stats={{ activeListings, totalViews, openLeads, unreadMessages }}
        leads={allLeadsResult.rows}
        listings={myListingsResult.rows}
        conversations={conversationsResult.rows}
        formatPrice={null}
      />

      {/* My Listings */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark">My Listings</h2>
          <Link href="/properties" className="text-sm text-primary font-medium hover:underline">View All →</Link>
        </div>

        {myListingsResult.rows.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏡</span>
            </div>
            <h3 className="font-bold text-dark text-lg mb-2">No listings yet</h3>
            <p className="text-sm text-gray-500 mb-6">Ready to list your property? It only takes a few minutes.</p>
            <Link href="/properties/new" className="inline-block px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/20">
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {myListingsResult.rows.map((p: any) => {
              const daysListed = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                  <div className="h-32 bg-gray-100 relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
                    )}
                    <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${
                      p.status === "active" ? "bg-green-500" : p.status === "sold" ? "bg-red-500" : "bg-gray-500"
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-dark text-sm truncate">{p.title}</h3>
                    <p className="text-sm font-bold text-primary">{formatPrice(Number(p.price))}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                      <span>👁️ {p.views_count} views</span>
                      <span>📩 {p.inquiries_count} inquiries</span>
                      <span>{daysListed}d</span>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <Link href={`/properties/${p.id}`} className="flex-1 text-center px-2 py-1.5 text-xs font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        View
                      </Link>
                      <Link href={`/properties/${p.id}/edit`} className="flex-1 text-center px-2 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Messages */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark">Recent Messages</h2>
          <Link href="/messages" className="text-sm text-primary font-medium hover:underline">View All →</Link>
        </div>

        {conversationsResult.rows.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md divide-y divide-gray-100">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {conversationsResult.rows.map((conv: any) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(conv.other_name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-dark text-sm">{conv.other_name}</span>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.property_title && (
                    <p className="text-xs text-gray-400 truncate">{conv.property_title}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
