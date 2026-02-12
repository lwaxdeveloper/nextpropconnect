import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

// Safe query wrapper
async function safeQuery<T>(queryFn: () => Promise<{ rows: T[] }>, defaultValue: T[] = []): Promise<T[]> {
  try {
    const result = await queryFn();
    return result.rows;
  } catch (error) {
    console.error('Query error:', error);
    return defaultValue;
  }
}

export default async function RenterDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { name?: string | null; email?: string | null; role?: string; id?: string };
  const userId = parseInt(user.id || "0");

  let tenancy: any = null;
  let nextPayment: any = null;
  let payments: any[] = [];
  let maintenanceRequests: any[] = [];
  let roommates: any[] = [];
  let unreadCount = 0;
  let savedCount = 0;

  try {
    const tenancyResult = await query(
      `SELECT t.*, 
         p.title as property_title, p.address, p.city,
         (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as property_image,
         pu.unit_name,
         u.name as landlord_name, u.phone as landlord_phone, u.email as landlord_email
       FROM tenants t
       JOIN properties p ON t.property_id = p.id
       LEFT JOIN property_units pu ON t.unit_id = pu.id
       JOIN users u ON t.landlord_id = u.id
       WHERE t.user_id = $1 AND t.status = 'active'
       ORDER BY t.lease_start DESC
       LIMIT 1`,
      [userId]
    );
    tenancy = tenancyResult.rows[0] || null;

    if (tenancy) {
      const nextPaymentResult = await safeQuery(() => query(
        `SELECT * FROM rent_payments WHERE tenant_id = $1 AND status = 'pending' ORDER BY due_date ASC LIMIT 1`,
        [tenancy.id]
      ));
      nextPayment = nextPaymentResult[0] || null;

      payments = await safeQuery(() => query(
        `SELECT * FROM rent_payments WHERE tenant_id = $1 ORDER BY due_date DESC LIMIT 5`,
        [tenancy.id]
      ));

      maintenanceRequests = await safeQuery(() => query(
        `SELECT * FROM maintenance_requests WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [tenancy.id]
      ));

      roommates = await safeQuery(() => query(
        `SELECT t.tenant_name, t.tenant_email, u.name, u.avatar_url
         FROM tenants t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.property_id = $1 AND t.status = 'active' AND t.id != $2
         LIMIT 10`,
        [tenancy.property_id, tenancy.id]
      ));
    }

    const unreadResult = await safeQuery(() => query(
      `SELECT COUNT(*)::int as count FROM messages m 
       JOIN conversations c ON m.conversation_id = c.id 
       WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id != $1 AND m.is_read = FALSE`,
      [userId]
    ));
    unreadCount = unreadResult[0]?.count || 0;

    const savedResult = await safeQuery(() => query(
      `SELECT COUNT(*)::int as count FROM saved_properties WHERE user_id = $1`,
      [userId]
    ));
    savedCount = savedResult[0]?.count || 0;
  } catch (err) {
    console.error('Renter dashboard error:', err);
  }

  const propertyImage = tenancy?.property_image || null;
  const daysUntilLeaseEnd = tenancy?.lease_end 
    ? Math.ceil((new Date(tenancy.lease_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Welcome back, {user.name?.split(" ")[0] || "Renter"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      {tenancy ? (
        <>
          {/* Current Rental Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🏠</span>
                My Rental
              </h2>
              {daysUntilLeaseEnd !== null && daysUntilLeaseEnd <= 60 && daysUntilLeaseEnd > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                  ⚠️ Lease ends in {daysUntilLeaseEnd} days
                </span>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {propertyImage ? (
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={propertyImage} alt="Property" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full md:w-48 h-32 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl">
                  🏠
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{tenancy.property_title}</h3>
                {tenancy.unit_name && (
                  <p className="text-primary font-medium">{tenancy.unit_name}</p>
                )}
                <p className="text-gray-500 text-sm">{tenancy.address}, {tenancy.city}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Monthly Rent</p>
                    <p className="font-bold text-lg text-primary">{formatPrice(tenancy.rent_amount)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="font-semibold">{tenancy.rent_due_day}{getOrdinal(tenancy.rent_due_day)} of month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Lease Start</p>
                    <p className="font-semibold">{new Date(tenancy.lease_start).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Lease End</p>
                    <p className="font-semibold">{tenancy.lease_end ? new Date(tenancy.lease_end).toLocaleDateString('en-ZA') : 'Month-to-month'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Landlord Contact */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {tenancy.landlord_name?.[0]?.toUpperCase() || 'L'}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Landlord</p>
                  <p className="font-medium">{tenancy.landlord_name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/renter/messages"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-2"
                >
                  💬 Message
                </Link>
                {tenancy.landlord_phone && (
                  <a
                    href={`tel:${tenancy.landlord_phone}`}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition flex items-center gap-2"
                  >
                    📞 Call
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link href="/renter/payments" className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💳</span>
                <span className="text-xs text-gray-500">Next Payment</span>
              </div>
              <p className={`text-2xl font-bold ${nextPayment ? 'text-orange-600' : 'text-green-600'}`}>
                {nextPayment ? formatPrice(nextPayment.amount) : 'Paid'}
              </p>
              <p className="text-xs text-gray-400">{nextPayment ? `Due ${new Date(nextPayment.due_date).toLocaleDateString('en-ZA')}` : 'All caught up!'}</p>
            </Link>
            
            <Link href="/renter/maintenance" className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔧</span>
                <span className="text-xs text-gray-500">Open Issues</span>
              </div>
              <p className="text-2xl font-bold">{maintenanceRequests.filter((m: any) => m.status !== 'completed').length}</p>
              <p className="text-xs text-gray-400">Maintenance</p>
            </Link>

            <Link href="/renter/roommates" className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👥</span>
                <span className="text-xs text-gray-500">Roommates</span>
              </div>
              <p className="text-2xl font-bold">{roommates.length}</p>
              <p className="text-xs text-gray-400">{roommates.length === 1 ? 'person' : 'people'}</p>
            </Link>

            <Link href="/saved" className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">❤️</span>
                <span className="text-xs text-gray-500">Saved</span>
              </div>
              <p className="text-2xl font-bold">{savedCount}</p>
              <p className="text-xs text-gray-400">Properties</p>
            </Link>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">💳</span>
                  Recent Payments
                </h2>
                <Link href="/renter/payments" className="text-primary text-sm hover:underline">View all →</Link>
              </div>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.slice(0, 3).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatPrice(payment.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.due_date).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No payment records yet</p>
              )}
              {nextPayment && (
                <Link
                  href="/renter/payments"
                  className="mt-4 block w-full text-center py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
                >
                  Pay {formatPrice(nextPayment.amount)} Now
                </Link>
              )}
            </div>

            {/* Maintenance Requests */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">🔧</span>
                  Maintenance
                </h2>
                <Link href="/renter/maintenance/new" className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                  + Report Issue
                </Link>
              </div>
              {maintenanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceRequests.slice(0, 3).map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{req.title || req.category}</p>
                        <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString('en-ZA')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        req.status === 'completed' ? 'bg-green-100 text-green-700' :
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-2">No maintenance requests</p>
                  <p className="text-xs text-gray-400">Something broken? Report it!</p>
                </div>
              )}
            </div>
          </div>

          {/* Roommates */}
          {roommates.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 mt-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">👥</span>
                Your Roommates
              </h2>
              <div className="flex flex-wrap gap-4">
                {roommates.map((rm: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(rm.name || rm.tenant_name || 'R')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rm.name || rm.tenant_name}</p>
                      {rm.tenant_email && <p className="text-xs text-gray-500">{rm.tenant_email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No Active Tenancy */
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-xl font-bold mb-2">No Active Rental</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You're not currently renting a property through NextPropConnect. 
            Browse available rentals or wait for your landlord to add you as a tenant.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/properties?listing_type=rent"
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition"
            >
              🔍 Browse Rentals
            </Link>
            <Link
              href="/saved"
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              ❤️ View Saved ({savedCount})
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
