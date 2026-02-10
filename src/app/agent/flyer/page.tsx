import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import FlyerGenerator from "./FlyerGenerator";

export const dynamic = "force-dynamic";

export default async function FlyerPage() {
  const session = await auth();
  const user = session!.user as { id?: string; name?: string };
  const userId = parseInt(user.id || "0");

  // Get agent's active listings
  const listingsResult = await query(
    `SELECT p.id, p.title, p.price, p.bedrooms, p.bathrooms, p.suburb, p.city, 
            p.property_type, p.listing_type, p.floor_size, p.erf_size,
            p.has_pool, p.has_garden, p.has_security, p.description,
       (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as image_url,
       (SELECT ARRAY_AGG(pi.url) FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 4) as images
     FROM properties p
     WHERE p.user_id = $1 AND p.status = 'active'
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [userId]
  );

  // Get agent profile
  const profileResult = await query(
    `SELECT u.name, u.phone, u.email, ap.agency_name, ap.bio
     FROM users u
     LEFT JOIN agent_profiles ap ON ap.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-2">Listing Flyer Generator</h1>
      <p className="text-gray-500 text-sm mb-6">
        Create professional flyers to share on social media or print
      </p>

      <FlyerGenerator
        listings={listingsResult.rows}
        agent={{
          name: profileResult.rows[0]?.name || user.name || "Agent",
          phone: profileResult.rows[0]?.phone || "",
          email: profileResult.rows[0]?.email || "",
          agency: profileResult.rows[0]?.agency_name || "",
        }}
      />
    </div>
  );
}
