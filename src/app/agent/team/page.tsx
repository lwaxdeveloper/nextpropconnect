import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Check if agent belongs to an agency
  const agentProfile = await query(
    `SELECT ap.agency_id, ap.agency_name, a.name as official_agency_name, a.admin_user_id
     FROM agent_profiles ap
     LEFT JOIN agencies a ON ap.agency_id = a.id
     WHERE ap.user_id = $1`,
    [userId]
  );

  const agencyId = agentProfile.rows[0]?.agency_id;
  const agencyName = agentProfile.rows[0]?.official_agency_name || agentProfile.rows[0]?.agency_name;
  const isAdmin = agentProfile.rows[0]?.admin_user_id === userId;

  // If not in an agency, show setup page
  if (!agencyId && !agentProfile.rows[0]?.agency_name) {
    return (
      <div>
        <h1 className="text-2xl font-black text-dark mb-6">Team</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-xl font-bold text-dark mb-2">Not Part of an Agency</h2>
          <p className="text-gray-500 mb-6">
            Join or create an agency to collaborate with other agents and share team visibility.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/agent/profile"
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              Set Agency Name
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get team members (agents in the same agency)
  const teamResult = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url,
            ap.bio, ap.agency_name,
            (SELECT COUNT(*) FROM properties p WHERE p.user_id = u.id AND p.status = 'active')::int as active_listings,
            (SELECT COUNT(*) FROM leads l WHERE l.agent_id = u.id AND l.status NOT IN ('won', 'lost'))::int as active_leads,
            (SELECT COUNT(*) FROM leads l WHERE l.agent_id = u.id AND l.status = 'won')::int as won_deals
     FROM users u
     JOIN agent_profiles ap ON ap.user_id = u.id
     WHERE ap.agency_id = $1 OR (ap.agency_name = $2 AND $3 IS NULL)
     ORDER BY won_deals DESC, active_listings DESC`,
    [agencyId, agencyName, agencyId]
  );

  // Get agency stats
  const agencyStats = await query(
    `SELECT 
       (SELECT COUNT(*) FROM properties p 
        JOIN users u ON p.user_id = u.id 
        JOIN agent_profiles ap ON ap.user_id = u.id 
        WHERE (ap.agency_id = $1 OR (ap.agency_name = $2 AND $3 IS NULL)) AND p.status = 'active')::int as total_listings,
       (SELECT COUNT(*) FROM leads l 
        JOIN agent_profiles ap ON ap.user_id = l.agent_id 
        WHERE (ap.agency_id = $1 OR (ap.agency_name = $2 AND $3 IS NULL)) AND l.status = 'won')::int as total_won
    `,
    [agencyId, agencyName, agencyId]
  );

  const stats = agencyStats.rows[0] || { total_listings: 0, total_won: 0 };
  const teamMembers = teamResult.rows;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-dark">{agencyName || "My Team"}</h1>
          <p className="text-gray-500 text-sm">
            {teamMembers.length} team member{teamMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/agent/team/manage"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            Manage Team
          </Link>
        )}
      </div>

      {/* Agency Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Team Members</p>
          <p className="text-2xl font-black text-dark">{teamMembers.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Listings</p>
          <p className="text-2xl font-black text-dark">{stats.total_listings}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Deals Won</p>
          <p className="text-2xl font-black text-green-600">{stats.total_won}</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark mb-4">Team Members</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {teamMembers.map((member: {
            id: number;
            name: string;
            email: string;
            avatar_url?: string;
            bio?: string;
            active_listings: number;
            active_leads: number;
            won_deals: number;
          }) => (
            <div
              key={member.id}
              className={`p-4 rounded-xl border ${
                member.id === userId ? "border-primary bg-primary/5" : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                      {member.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dark truncate">{member.name}</h3>
                    {member.id === userId && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-gray-600">
                      <span className="font-semibold text-dark">{member.active_listings}</span> listings
                    </span>
                    <span className="text-gray-600">
                      <span className="font-semibold text-dark">{member.active_leads}</span> leads
                    </span>
                    <span className="text-green-600">
                      <span className="font-semibold">{member.won_deals}</span> won
                    </span>
                  </div>
                </div>
                
                {member.id !== userId && (
                  <Link
                    href={`/agents/${member.id}`}
                    className="text-xs text-primary hover:underline flex-shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Listings Preview */}
      {teamMembers.length > 1 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-dark mb-4">Recent Team Listings</h2>
          <Link
            href="/properties?agency=true"
            className="text-sm text-primary hover:underline"
          >
            View all team listings →
          </Link>
        </div>
      )}
    </div>
  );
}
