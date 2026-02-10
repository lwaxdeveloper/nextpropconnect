import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string };
  if (user.role !== "admin") redirect("/dashboard");

  // Fetch waitlist
  const waitlistResult = await query(
    "SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 100"
  );
  const waitlist = waitlistResult.rows;

  // Fetch user count
  const userCountResult = await query("SELECT COUNT(*) as count FROM users");
  const userCount = userCountResult.rows[0].count;

  // Fetch property stats
  const propertyStatsResult = await query(`
    SELECT 
      COUNT(*) as total_listings,
      SUM(views_count) as total_views,
      SUM(inquiries_count) as total_inquiries,
      COUNT(*) FILTER (WHERE status = 'active') as active_listings
    FROM properties WHERE status != 'deleted'
  `);
  const propertyStats = propertyStatsResult.rows[0];

  // Fetch top properties by views
  const topPropertiesResult = await query(`
    SELECT p.id, p.title, p.views_count, p.inquiries_count, p.status, p.created_at,
      u.name as owner_name
    FROM properties p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status != 'deleted'
    ORDER BY p.views_count DESC
    LIMIT 20
  `);
  const topProperties = topPropertiesResult.rows;

  return (
    <div className="min-h-screen bg-light flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-6 hidden md:block">
        <Link href="/" className="block mb-8">
          <Logo size="sm" />
        </Link>
        <nav className="space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600"
          >
            <span>⚙️</span> Admin Panel
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <span>📊</span> Dashboard
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-dark">
            Admin Panel 🔒
          </h1>
          <p className="text-gray-500 mt-1">Manage NextPropConnect</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-dark">{userCount}</div>
            <div className="text-sm text-gray-500">Users</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-dark">{propertyStats.active_listings || 0}</div>
            <div className="text-sm text-gray-500">Active Listings</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black gradient-text">{propertyStats.total_views || 0}</div>
            <div className="text-sm text-gray-500">Total Views</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-primary">{propertyStats.total_inquiries || 0}</div>
            <div className="text-sm text-gray-500">Inquiries</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-dark">{waitlist.length}</div>
            <div className="text-sm text-gray-500">Waitlist</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="text-2xl font-black text-green-600">Phase 3</div>
            <div className="text-sm text-gray-500">Version</div>
          </div>
        </div>

        {/* Properties by Views */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-dark">
              📊 Properties by Views
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Property</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Owner</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Views</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Inquiries</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Listed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProperties.map((p: {
                  id: number;
                  title: string;
                  views_count: number;
                  inquiries_count: number;
                  status: string;
                  created_at: string;
                  owner_name: string;
                }) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/properties/${p.id}`} className="font-medium text-dark hover:text-primary truncate block max-w-xs">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.owner_name || "—"}</td>
                    <td className="px-6 py-4 text-right font-bold text-dark">{p.views_count}</td>
                    <td className="px-6 py-4 text-right text-primary font-medium">{p.inquiries_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        p.status === 'active' ? 'bg-green-100 text-green-700' :
                        p.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'rented' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(p.created_at).toLocaleDateString("en-ZA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-dark">
              Waitlist ({waitlist.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Area
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No signups yet. Share the landing page!
                    </td>
                  </tr>
                ) : (
                  waitlist.map(
                    (w: {
                      id: number;
                      name: string;
                      email: string;
                      phone: string;
                      role: string;
                      area: string;
                      created_at: string;
                    }) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-dark">
                          {w.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{w.email}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {w.phone || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-600">
                            {w.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {w.area || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(w.created_at).toLocaleDateString("en-ZA")}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
