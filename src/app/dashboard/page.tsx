import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import StatusBadge from "@/components/StatusBadge";
import { formatPrice } from "@/lib/format";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const navItems = [
  { icon: "📊", label: "Dashboard", href: "/dashboard", active: true },
  { icon: "🏠", label: "My Properties", href: "/dashboard/properties" },
  { icon: "➕", label: "List Property", href: "/properties/new" },
  { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
  { icon: "💬", label: "Messages", href: "/messages" },
  { icon: "🔔", label: "Notifications", href: "/notifications" },
  { icon: "🔍", label: "Browse Properties", href: "/properties" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { signOut } = await import("@/lib/auth");
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-red-500 transition"
      >
        Sign Out
      </button>
    </form>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { name?: string | null; email?: string | null; role?: string; id?: string };
  
  // Redirect agents to the full CRM dashboard
  if (user.role === "agent") {
    redirect("/agent");
  }
  
  const userId = parseInt(user.id || "0");

  // Check if user is a tenant - redirect to renter dashboard
  const tenantCheck = await query(
    `SELECT id FROM tenants WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId]
  );
  if (tenantCheck.rows.length > 0) {
    redirect("/renter");
  }

  // Fetch user's listings
  const listingsResult = await query(
    `SELECT p.*, 
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
    FROM properties p 
    WHERE p.user_id = $1 AND p.status != 'deleted'
    ORDER BY p.created_at DESC
    LIMIT 20`,
    [userId]
  );
  const listings = listingsResult.rows;

  // Stats
  const statsResult = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE status != 'deleted') as total_listings,
      COALESCE(SUM(views_count) FILTER (WHERE status != 'deleted'), 0) as total_views,
      COALESCE(SUM(inquiries_count) FILTER (WHERE status != 'deleted'), 0) as total_inquiries
    FROM properties WHERE user_id = $1`,
    [userId]
  );
  const stats = statsResult.rows[0];

  // Phase 2 stats
  const unreadResult = await query(
    `SELECT COUNT(*)::int as count FROM messages m 
     JOIN conversations c ON m.conversation_id = c.id 
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id != $1 AND m.is_read = FALSE`,
    [userId]
  );
  const unreadMessages = unreadResult.rows[0].count;

  const viewingsResult = await query(
    `SELECT COUNT(*)::int as count FROM viewing_requests vr
     JOIN conversations c ON vr.conversation_id = c.id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND vr.status = 'pending'`,
    [userId]
  );
  const pendingViewings = viewingsResult.rows[0].count;

  const alertsResult = await query(
    `SELECT COUNT(*)::int as count FROM property_alerts WHERE user_id = $1 AND is_active = TRUE`,
    [userId]
  );
  const activeAlerts = alertsResult.rows[0].count;

  const roleBadgeColors: Record<string, string> = {
    buyer: "bg-blue-100 text-blue-700",
    seller: "bg-green-100 text-green-700",
    agent: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
    agency_admin: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="min-h-screen bg-light flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-6 hidden md:block">
        <Link href="/" className="block mb-8">
          <Logo size="sm" />
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10">
        {/* Mobile header */}
        <div className="md:hidden mb-6 flex justify-between items-center">
          <Logo size="sm" />
          <SignOutButton />
        </div>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              Welcome, {user.name || "User"} 👋
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  roleBadgeColors[user.role || "buyer"] || roleBadgeColors.buyer
                }`}
              >
                {user.role || "buyer"}
              </span>
              <span className="text-gray-400 text-sm">{user.email}</span>
            </div>
          </div>
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-md text-sm"
          >
            ➕ Create New Listing
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-dark">{stats.total_listings}</div>
            <div className="text-sm text-gray-500">Properties Listed</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-dark">{stats.total_views}</div>
            <div className="text-sm text-gray-500">Total Views</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-dark">{stats.total_inquiries}</div>
            <div className="text-sm text-gray-500">Inquiries</div>
          </div>
        </div>

        {/* Communication Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/messages" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💬</span>
              {unreadMessages > 0 && (
                <span className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-dark">{unreadMessages}</div>
            <div className="text-sm text-gray-500">Unread Messages</div>
          </Link>
          <Link href="/messages" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📅</span>
              {pendingViewings > 0 && (
                <span className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingViewings}
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-dark">{pendingViewings}</div>
            <div className="text-sm text-gray-500">Pending Viewings</div>
          </Link>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔔</span>
            </div>
            <div className="text-2xl font-black text-dark">{activeAlerts}</div>
            <div className="text-sm text-gray-500">Active Alerts</div>
          </div>
        </div>

        {/* My Listings */}
        <h2 className="text-xl font-bold text-dark mb-4">My Listings</h2>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">🏡</div>
            <h3 className="font-bold text-dark mb-2">No listings yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ready to list your property? It only takes a few minutes.
            </p>
            <Link
              href="/properties/new"
              className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition"
            >
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {listings.map((p: any) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* Thumbnail */}
                <div className="w-full sm:w-32 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                      🏠
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={p.status} listingType={p.listing_type} />
                    {p.is_featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        ⭐
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-dark text-sm truncate">
                    {p.title}
                  </h3>
                  <p className="text-sm font-semibold text-dark">
                    {formatPrice(Number(p.price))}
                    {p.listing_type === "rent" && (
                      <span className="text-xs font-normal text-gray-500"> /mo</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    📍 {[p.suburb, p.city].filter(Boolean).join(", ")} · 👁️ {p.views_count} views
                  </p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/properties/${p.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-center"
                  >
                    View
                  </Link>
                  <Link
                    href={`/properties/${p.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition text-center"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
