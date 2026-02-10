import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import LeadsPageClient from "./LeadsPageClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  const leadsResult = await query(
    `SELECT l.*, p.title as property_title, p.price as property_price, p.suburb, p.city
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.agent_id = $1
     ORDER BY l.updated_at DESC`,
    [userId]
  );

  // Get agent's properties for the add lead form
  const propertiesResult = await query(
    `SELECT id, title, price FROM properties WHERE user_id = $1 AND status = 'active' ORDER BY title`,
    [userId]
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-6">Lead Management</h1>
      <LeadsPageClient
        initialLeads={leadsResult.rows}
        properties={propertiesResult.rows}
      />
    </div>
  );
}
