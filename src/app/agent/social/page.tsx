import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import SocialPostGenerator from "./SocialPostGenerator";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const session = await auth();
  const user = session!.user as { id?: string; name?: string };
  const userId = parseInt(user.id || "0");

  // Get agent's active listings
  const listingsResult = await query(
    `SELECT p.id, p.title, p.price, p.bedrooms, p.bathrooms, p.suburb, p.city, p.property_type, p.listing_type,
       p.has_pool, p.has_garden, p.has_security, p.floor_size,
       (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as image_url
     FROM properties p
     WHERE p.user_id = $1 AND p.status = 'active'
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [userId]
  );

  // Get agent profile for contact info
  const profileResult = await query(
    `SELECT u.name, u.phone, ap.agency_name, ap.enable_whatsapp
     FROM users u
     LEFT JOIN agent_profiles ap ON ap.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-2">Social Media Posts</h1>
      <p className="text-gray-500 text-sm mb-6">
        Generate ready-to-share posts for Facebook, Instagram, and WhatsApp
      </p>

      <SocialPostGenerator
        listings={listingsResult.rows}
        agentName={profileResult.rows[0]?.name || user.name || "Agent"}
        agentPhone={profileResult.rows[0]?.phone || ""}
        agencyName={profileResult.rows[0]?.agency_name || ""}
        enableWhatsapp={profileResult.rows[0]?.enable_whatsapp || false}
      />
    </div>
  );
}
