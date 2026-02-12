import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RenterMaintenancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Get tenant info
  const tenantResult = await query(
    `SELECT t.id, p.title as property_title
     FROM tenants t
     JOIN properties p ON t.property_id = p.id
     WHERE t.user_id = $1 AND t.status = 'active'
     LIMIT 1`,
    [userId]
  );
  const tenant = tenantResult.rows[0];

  if (!tenant) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold mb-2">No Active Rental</h1>
          <p className="text-gray-500 mb-6">You need an active rental to report maintenance issues.</p>
          <Link href="/renter" className="text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Get maintenance requests
  const requestsResult = await query(
    `SELECT * FROM maintenance_requests 
     WHERE tenant_id = $1 
     ORDER BY created_at DESC`,
    [tenant.id]
  );
  const requests = requestsResult.rows;

  const openRequests = requests.filter((r: any) => r.status !== 'completed' && r.status !== 'cancelled');
  const closedRequests = requests.filter((r: any) => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🔧 Maintenance</h1>
            <p className="text-gray-500 text-sm">{tenant.property_title}</p>
          </div>
          <Link
            href="/renter/maintenance/new"
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition flex items-center gap-2"
          >
            <span>+</span> Report Issue
          </Link>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-700 text-sm">
            <strong>💡 Tip:</strong> For emergencies (water leaks, electrical issues, security), 
            mark your request as <strong>Urgent</strong> and call your landlord directly.
          </p>
        </div>

        {/* Open Requests */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">🔴</span>
            Open Requests ({openRequests.length})
          </h2>
          {openRequests.length > 0 ? (
            <div className="space-y-3">
              {openRequests.map((req: any) => (
                <div key={req.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCategoryIcon(req.category)}</span>
                        <p className="font-semibold">{req.title || req.category}</p>
                        {req.priority === 'urgent' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                            🚨 Urgent
                          </span>
                        )}
                        {req.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                            High
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{req.description?.slice(0, 150)}{req.description?.length > 150 ? '...' : ''}</p>
                      <p className="text-xs text-gray-400">
                        Reported: {new Date(req.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {formatStatus(req.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-500 font-medium">No open requests</p>
              <p className="text-gray-400 text-sm">Everything is working well!</p>
            </div>
          )}
        </div>

        {/* Resolved Requests */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">✅</span>
            Resolved ({closedRequests.length})
          </h2>
          {closedRequests.length > 0 ? (
            <div className="space-y-3">
              {closedRequests.slice(0, 5).map((req: any) => (
                <div key={req.id} className="p-4 bg-gray-50 rounded-xl opacity-70">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getCategoryIcon(req.category)}</span>
                        <p className="font-medium">{req.title || req.category}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Reported: {new Date(req.created_at).toLocaleDateString('en-ZA')}
                        {req.resolved_at && ` • Resolved: ${new Date(req.resolved_at).toLocaleDateString('en-ZA')}`}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
              {closedRequests.length > 5 && (
                <p className="text-center text-sm text-gray-400 pt-2">
                  + {closedRequests.length - 5} more resolved requests
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No resolved requests yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Plumbing': '🚿',
    'Electrical': '⚡',
    'HVAC / Air Conditioning': '❄️',
    'Appliances': '🔌',
    'Structural': '🏗️',
    'Pest Control': '🐛',
    'Security': '🔒',
    'Cleaning': '🧹',
  };
  return icons[category] || '🔧';
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'scheduled': 'Scheduled',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  return labels[status] || status;
}
