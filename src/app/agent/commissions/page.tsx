import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Get agent's commission rate
  const profileResult = await query(
    `SELECT commission_rate FROM agent_profiles WHERE user_id = $1`,
    [userId]
  );
  const commissionRate = profileResult.rows[0]?.commission_rate || 5; // Default 5%

  // Get won leads with property values
  const wonLeadsResult = await query(
    `SELECT l.id, l.contact_name, l.created_at, l.updated_at,
       p.id as property_id, p.title as property_title, p.price as property_price, p.suburb, p.city
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.agent_id = $1 AND l.status = 'won'
     ORDER BY l.updated_at DESC`,
    [userId]
  );

  // Get pipeline leads with potential value
  const pipelineResult = await query(
    `SELECT l.status, 
       COUNT(*)::int as count,
       COALESCE(SUM(COALESCE(l.budget, p.price)), 0)::numeric as total_value
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.agent_id = $1 AND l.status NOT IN ('won', 'lost')
     GROUP BY l.status`,
    [userId]
  );

  // Calculate stats
  const wonDeals = wonLeadsResult.rows;
  const totalEarned = wonDeals.reduce((sum: number, deal: { property_price?: number }) => {
    const dealValue = Number(deal.property_price || 0);
    return sum + (dealValue * (commissionRate / 100));
  }, 0);

  const pipelineValue = pipelineResult.rows.reduce(
    (sum: number, stage: { total_value: number }) => sum + Number(stage.total_value || 0),
    0
  );
  const potentialEarnings = pipelineValue * (commissionRate / 100);

  // Stage weights for expected value calculation
  const stageWeights: Record<string, number> = {
    new: 0.05,
    contacted: 0.1,
    viewing_done: 0.25,
    negotiating: 0.5,
    offer: 0.75,
  };

  const weightedPotential = pipelineResult.rows.reduce(
    (sum: number, stage: { status: string; total_value: number }) => {
      const weight = stageWeights[stage.status] || 0.1;
      return sum + Number(stage.total_value || 0) * weight * (commissionRate / 100);
    },
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-dark">Commission Tracker</h1>
        <Link
          href="/agent/profile"
          className="text-sm text-primary hover:underline"
        >
          Edit Commission Rate ({commissionRate}%)
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">
              💰
            </div>
            <span className="text-sm text-gray-500">Total Earned</span>
          </div>
          <div className="text-2xl font-black text-green-600">
            {formatPrice(totalEarned)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            From {wonDeals.length} closed deal{wonDeals.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
              📊
            </div>
            <span className="text-sm text-gray-500">Pipeline Value</span>
          </div>
          <div className="text-2xl font-black text-blue-600">
            {formatPrice(potentialEarnings)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            If all deals close ({formatPrice(pipelineValue)} total)
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
              🎯
            </div>
            <span className="text-sm text-gray-500">Expected Value</span>
          </div>
          <div className="text-2xl font-black text-purple-600">
            {formatPrice(weightedPotential)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Weighted by deal stage probability
          </p>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="font-bold text-dark mb-4">Pipeline Breakdown</h2>
        <div className="space-y-3">
          {[
            { key: "new", label: "New Leads", color: "bg-blue-500", weight: "5%" },
            { key: "contacted", label: "Contacted", color: "bg-yellow-500", weight: "10%" },
            { key: "viewing_done", label: "Viewing Done", color: "bg-purple-500", weight: "25%" },
            { key: "negotiating", label: "Negotiating", color: "bg-orange-500", weight: "50%" },
            { key: "offer", label: "Offer Made", color: "bg-indigo-500", weight: "75%" },
          ].map((stage) => {
            const stageData = pipelineResult.rows.find(
              (r: { status: string }) => r.status === stage.key
            );
            const count = stageData?.count || 0;
            const value = Number(stageData?.total_value || 0);
            const commission = value * (commissionRate / 100);
            const expectedValue = commission * (stageWeights[stage.key] || 0.1);

            return (
              <div
                key={stage.key}
                className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0"
              >
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-dark">{stage.label}</span>
                    <span className="text-sm text-gray-500">{count} leads</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Potential: {formatPrice(commission)}</span>
                    <span>Expected ({stage.weight}): {formatPrice(expectedValue)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed Deals */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark mb-4">Closed Deals</h2>
        {wonDeals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🏆</div>
            <p>No closed deals yet</p>
            <p className="text-sm mt-1">Keep working your pipeline!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Client</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Property</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500">Sale Price</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500">Commission</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500">Closed</th>
                </tr>
              </thead>
              <tbody>
                {wonDeals.map((deal: {
                  id: number;
                  contact_name: string;
                  property_title?: string;
                  suburb?: string;
                  city?: string;
                  property_price?: number;
                  updated_at: string;
                }) => {
                  const salePrice = Number(deal.property_price || 0);
                  const commission = salePrice * (commissionRate / 100);
                  return (
                    <tr key={deal.id} className="border-b border-gray-50">
                      <td className="py-3 px-3 font-medium text-dark">{deal.contact_name}</td>
                      <td className="py-3 px-3 text-gray-600">
                        {deal.property_title || `${deal.suburb}, ${deal.city}` || "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600">{formatPrice(salePrice)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-green-600">{formatPrice(commission)}</td>
                      <td className="py-3 px-3 text-right text-gray-500 text-xs">
                        {new Date(deal.updated_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="py-3 px-3 font-bold text-dark">Total</td>
                  <td className="py-3 px-3 text-right font-bold text-green-600">{formatPrice(totalEarned)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
