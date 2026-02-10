import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import LeadDetailPage from "./LeadDetailPage";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");
  const { id } = await params;

  const leadResult = await query(
    `SELECT l.*, p.title as property_title, p.suburb, p.city, p.price as property_price, p.listing_type,
       (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as property_image
     FROM leads l
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.id = $1 AND l.agent_id = $2`,
    [parseInt(id), userId]
  );

  if (leadResult.rows.length === 0) {
    redirect("/agent/leads");
  }

  const activitiesResult = await query(
    `SELECT * FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC`,
    [parseInt(id)]
  );

  const lead = { ...leadResult.rows[0], activities: activitiesResult.rows };

  return <LeadDetailPage lead={lead} />;
}
