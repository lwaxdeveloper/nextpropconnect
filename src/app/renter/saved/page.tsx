import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SavedPropertiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  let savedProperties: any[] = [];

  try {
    const result = await query(
      `SELECT sp.id as save_id, sp.created_at as saved_at,
         p.*,
         (SELECT url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url,
         u.name as agent_name, u.avatar_url as agent_avatar,
         a.name as agency_name
       FROM saved_properties sp
       JOIN properties p ON sp.property_id = p.id
       LEFT JOIN users u ON p.agent_id = u.id
       LEFT JOIN agent_profiles ap ON u.id = ap.user_id
       LEFT JOIN agencies a ON ap.agency_id = a.id
       WHERE sp.user_id = $1
       ORDER BY sp.created_at DESC`,
      [userId]
    );
    savedProperties = result.rows;
  } catch (err) {
    console.error("Error fetching saved properties:", err);
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">❤️ Saved Properties</h1>
            <p className="text-gray-500 text-sm">
              {savedProperties.length} saved {savedProperties.length === 1 ? "property" : "properties"}
            </p>
          </div>
          <Link
            href="/properties"
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
          >
            🔍 Find More
          </Link>
        </div>

        {savedProperties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property: any) => (
              <div
                key={property.save_id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3]">
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">🏠</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      property.listing_type === "rent" 
                        ? "bg-blue-500 text-white" 
                        : "bg-green-500 text-white"
                    }`}>
                      {property.listing_type === "rent" ? "For Rent" : "For Sale"}
                    </span>
                  </div>
                  {/* Remove Button */}
                  <form action={`/api/properties/${property.id}/unsave`} method="POST">
                    <button 
                      type="submit"
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-white transition"
                    >
                      ❤️
                    </button>
                  </form>
                </div>

                {/* Content */}
                <Link href={`/properties/${property.id}`} className="block p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition">
                      {property.title}
                    </h3>
                  </div>
                  
                  <p className="text-2xl font-bold text-primary mb-2">
                    {formatPrice(property.price)}
                    {property.listing_type === "rent" && <span className="text-sm font-normal text-gray-500">/month</span>}
                  </p>
                  
                  <p className="text-gray-500 text-sm mb-3 line-clamp-1">
                    📍 {property.address}, {property.city}
                  </p>

                  {/* Features */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        🛏️ {property.bedrooms}
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-1">
                        🚿 {property.bathrooms}
                      </span>
                    )}
                    {property.floor_size && (
                      <span className="flex items-center gap-1">
                        📐 {property.floor_size}m²
                      </span>
                    )}
                  </div>

                  {/* Agent */}
                  {property.agent_name && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {property.agent_avatar ? (
                        <img src={property.agent_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                          {property.agent_name[0]}
                        </div>
                      )}
                      <div className="text-xs">
                        <p className="font-medium">{property.agent_name}</p>
                        {property.agency_name && <p className="text-gray-500">{property.agency_name}</p>}
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-12 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-bold mb-2">No Saved Properties</h2>
            <p className="text-gray-500 mb-6">
              Start browsing and save properties you're interested in!
            </p>
            <Link
              href="/properties"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              🔍 Browse Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
