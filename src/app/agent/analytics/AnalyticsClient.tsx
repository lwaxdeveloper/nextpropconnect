"use client";

import { FunnelChart, BarChart } from "@/components/agent/SimpleChart";

interface Props {
  leads: {
    new_count: number;
    contacted: number;
    viewing_done: number;
    negotiating: number;
    offer_count: number;
    won: number;
    lost: number;
  };
  listings: Array<{
    id: number;
    title: string;
    views_count: number;
    inquiries_count: number;
    formatted_price: string;
    image_url?: string;
    suburb?: string;
    city?: string;
  }>;
  totalStats: {
    views: number;
    inquiries: number;
  };
  comparison: {
    messagesThisMonth: number;
    messagesLastMonth: number;
    viewingsThisMonth: number;
    viewingsLastMonth: number;
  };
  responseTime: {
    avgMinutes: number;
    respondedCount: number;
    pendingResponse: number;
  };
  conversion: {
    wonCount: number;
    closedCount: number;
    totalLeads: number;
  };
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function AnalyticsClient({ leads, listings, totalStats, comparison, responseTime, conversion }: Props) {
  const conversionRate = conversion.closedCount > 0 
    ? Math.round((conversion.wonCount / conversion.closedCount) * 100) 
    : 0;
  const funnelStages = [
    { label: "New", value: leads.new_count, color: "#3B82F6" },
    { label: "Contacted", value: leads.contacted, color: "#EAB308" },
    { label: "Viewing Done", value: leads.viewing_done, color: "#A855F7" },
    { label: "Negotiating", value: leads.negotiating, color: "#F97316" },
    { label: "Offer", value: leads.offer_count, color: "#6366F1" },
    { label: "Won", value: leads.won, color: "#22C55E" },
  ];

  // Views bar chart data from top listings
  const viewsData = listings.slice(0, 10).map((l) => ({
    label: l.title.slice(0, 12),
    value: l.views_count,
  }));

  return (
    <div className="space-y-8">
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Avg Response Time</p>
          <p className="text-2xl font-black text-dark">
            {responseTime.avgMinutes > 0 ? formatResponseTime(responseTime.avgMinutes) : "—"}
          </p>
          <p className={`text-xs mt-1 ${responseTime.avgMinutes <= 30 ? "text-green-500" : responseTime.avgMinutes <= 120 ? "text-yellow-500" : "text-red-500"}`}>
            {responseTime.avgMinutes <= 30 ? "⚡ Excellent" : responseTime.avgMinutes <= 120 ? "👍 Good" : "🐌 Needs improvement"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
          <p className="text-2xl font-black text-dark">{conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {conversion.wonCount} won / {conversion.closedCount} closed
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Pending Response</p>
          <p className="text-2xl font-black text-dark">{responseTime.pendingResponse}</p>
          {responseTime.pendingResponse > 0 && (
            <a href="/agent/leads?status=new" className="text-xs text-primary mt-1 hover:underline">
              Respond now →
            </a>
          )}
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Property Views</p>
          <p className="text-2xl font-black text-dark">{totalStats.views.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Inquiries</p>
          <p className="text-2xl font-black text-dark">{totalStats.inquiries.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Messages Sent (This Month)</p>
          <p className="text-2xl font-black text-dark">{comparison.messagesThisMonth}</p>
          <p className={`text-xs mt-1 ${comparison.messagesThisMonth >= comparison.messagesLastMonth ? "text-green-500" : "text-red-500"}`}>
            {pctChange(comparison.messagesThisMonth, comparison.messagesLastMonth)} vs last month
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Viewings (This Month)</p>
          <p className="text-2xl font-black text-dark">{comparison.viewingsThisMonth}</p>
          <p className={`text-xs mt-1 ${comparison.viewingsThisMonth >= comparison.viewingsLastMonth ? "text-green-500" : "text-red-500"}`}>
            {pctChange(comparison.viewingsThisMonth, comparison.viewingsLastMonth)} vs last month
          </p>
        </div>
      </div>

      {/* Lead Funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Lead Funnel</h3>
        {funnelStages.every((s) => s.value === 0) ? (
          <p className="text-sm text-gray-400 text-center py-8">No leads yet. Add leads to see your funnel.</p>
        ) : (
          <FunnelChart stages={funnelStages} />
        )}
        {leads.lost > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Lost leads</span>
              <span className="text-sm font-bold text-red-500">{leads.lost}</span>
            </div>
          </div>
        )}
      </div>

      {/* Views by Listing */}
      {viewsData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-dark mb-4">Views by Listing</h3>
          <BarChart data={viewsData} height={180} />
        </div>
      )}

      {/* Top Performing Listings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Top Performing Listings</h3>
        {listings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing, idx) => (
              <a
                key={listing.id}
                href={`/properties/${listing.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <span className="text-lg font-bold text-gray-300 w-6 text-center">{idx + 1}</span>
                {listing.image_url ? (
                  <img src={listing.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">🏠</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark truncate">{listing.title}</p>
                  <p className="text-xs text-gray-400">{[listing.suburb, listing.city].filter(Boolean).join(", ")}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-dark">{listing.views_count} views</p>
                  <p className="text-xs text-gray-400">{listing.inquiries_count} inquiries</p>
                  {listing.views_count > 0 && (
                    <p className="text-[10px] text-primary font-medium">
                      {((listing.inquiries_count / listing.views_count) * 100).toFixed(1)}% conversion
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
