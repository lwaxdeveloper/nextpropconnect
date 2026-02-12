import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import BulkMessageClient from "./BulkMessageClient";

export const dynamic = "force-dynamic";

export default async function BulkMessagePage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Get agent's leads with contact info
  const leadsResult = await query(
    `SELECT l.id, l.contact_name, l.contact_phone, l.contact_email, l.status, l.priority,
            p.title as property_title
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.agent_id = $1
     ORDER BY l.created_at DESC
     LIMIT 100`,
    [userId]
  );

  // Get quick reply templates
  const templatesResult = await query(
    `SELECT id, title as name, content FROM quick_replies WHERE agent_id = $1 ORDER BY title`,
    [userId]
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-2">Bulk Messaging</h1>
      <p className="text-gray-500 text-sm mb-6">
        Send messages to multiple leads at once via WhatsApp
      </p>

      <BulkMessageClient
        leads={leadsResult.rows}
        templates={templatesResult.rows}
      />
    </div>
  );
}
