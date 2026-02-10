import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Current period stats
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Properties with views/inquiries
  const listingsResult = await query(
    `SELECT p.id, p.title, p.views_count, p.inquiries_count, p.suburb, p.city, p.price, p.listing_type, p.created_at,
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as image_url
     FROM properties p
     WHERE p.user_id = $1 AND p.status != 'deleted'
     ORDER BY p.views_count DESC
     LIMIT 10`,
    [userId]
  );

  // Lead funnel
  const leadsResult = await query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'new')::int as new_count,
       COUNT(*) FILTER (WHERE status = 'contacted')::int as contacted,
       COUNT(*) FILTER (WHERE status = 'viewing_done')::int as viewing_done,
       COUNT(*) FILTER (WHERE status = 'negotiating')::int as negotiating,
       COUNT(*) FILTER (WHERE status = 'offer')::int as offer_count,
       COUNT(*) FILTER (WHERE status = 'won')::int as won,
       COUNT(*) FILTER (WHERE status = 'lost')::int as lost
     FROM leads WHERE agent_id = $1`,
    [userId]
  );

  // Messages this month vs last month
  const msgThisMonth = await query(
    `SELECT COUNT(*)::int as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id = $1 AND m.created_at >= $2`,
    [userId, thisMonthStart]
  );
  const msgLastMonth = await query(
    `SELECT COUNT(*)::int as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id = $1 AND m.created_at >= $2 AND m.created_at < $3`,
    [userId, lastMonthStart, lastMonthEnd]
  );

  // Viewings this month vs last
  const viewingsThisMonth = await query(
    `SELECT COUNT(*)::int as count FROM viewing_requests vr
     JOIN conversations c ON vr.conversation_id = c.id
     WHERE c.seller_id = $1 AND vr.created_at >= $2`,
    [userId, thisMonthStart]
  );
  const viewingsLastMonth = await query(
    `SELECT COUNT(*)::int as count FROM viewing_requests vr
     JOIN conversations c ON vr.conversation_id = c.id
     WHERE c.seller_id = $1 AND vr.created_at >= $2 AND vr.created_at < $3`,
    [userId, lastMonthStart, lastMonthEnd]
  );

  // Total views & inquiries
  const totalStatsResult = await query(
    `SELECT COALESCE(SUM(views_count), 0)::int as views, COALESCE(SUM(inquiries_count), 0)::int as inquiries
     FROM properties WHERE user_id = $1 AND status != 'deleted'`,
    [userId]
  );

  // Response time stats (average time from lead creation to first response)
  const responseTimeResult = await query(
    `SELECT 
       ROUND(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60))::int as avg_response_minutes,
       COUNT(*) FILTER (WHERE first_response_at IS NOT NULL)::int as responded_count,
       COUNT(*) FILTER (WHERE first_response_at IS NULL AND status = 'new')::int as pending_response
     FROM leads WHERE agent_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
    [userId]
  );

  // Conversion rate (leads won / total closed leads)
  const conversionResult = await query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'won')::int as won_count,
       COUNT(*) FILTER (WHERE status IN ('won', 'lost'))::int as closed_count,
       COUNT(*)::int as total_leads
     FROM leads WHERE agent_id = $1`,
    [userId]
  );

  // Format listing prices for client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = listingsResult.rows.map((l: any) => ({
    id: l.id as number,
    title: l.title as string,
    views_count: l.views_count as number,
    inquiries_count: l.inquiries_count as number,
    image_url: l.image_url as string | undefined,
    suburb: l.suburb as string | undefined,
    city: l.city as string | undefined,
    formatted_price: formatPrice(Number(l.price)),
  }));

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-6">Performance Analytics</h1>

      <AnalyticsClient
        leads={leadsResult.rows[0]}
        listings={listings}
        totalStats={totalStatsResult.rows[0]}
        comparison={{
          messagesThisMonth: msgThisMonth.rows[0].count,
          messagesLastMonth: msgLastMonth.rows[0].count,
          viewingsThisMonth: viewingsThisMonth.rows[0].count,
          viewingsLastMonth: viewingsLastMonth.rows[0].count,
        }}
        responseTime={{
          avgMinutes: responseTimeResult.rows[0].avg_response_minutes || 0,
          respondedCount: responseTimeResult.rows[0].responded_count,
          pendingResponse: responseTimeResult.rows[0].pending_response,
        }}
        conversion={{
          wonCount: conversionResult.rows[0].won_count,
          closedCount: conversionResult.rows[0].closed_count,
          totalLeads: conversionResult.rows[0].total_leads,
        }}
      />
    </div>
  );
}
