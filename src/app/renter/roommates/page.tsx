import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RoommatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Check if user has active tenancy
  let hasActiveTenancy = false;
  let userListing: any = null;
  
  try {
    const tenantResult = await query(
      `SELECT t.id, p.city FROM tenants t 
       JOIN properties p ON t.property_id = p.id 
       WHERE t.user_id = $1 AND t.status = 'active' LIMIT 1`,
      [userId]
    );
    hasActiveTenancy = tenantResult.rows.length > 0;

    // Check if user has an existing roommate listing
    const listingResult = await query(
      `SELECT * FROM roommate_listings WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    userListing = listingResult.rows[0] || null;
  } catch (err) {
    console.error("Error:", err);
  }

  // Fetch active roommate listings (both looking for room and offering room)
  let lookingForRoom: any[] = [];
  let offeringRoom: any[] = [];
  
  try {
    const lookingResult = await query(
      `SELECT rl.*, u.name, u.avatar_url
       FROM roommate_listings rl
       JOIN users u ON rl.user_id = u.id
       WHERE rl.type = 'looking' AND rl.status = 'active'
       ORDER BY rl.created_at DESC
       LIMIT 20`
    );
    lookingForRoom = lookingResult.rows;

    const offeringResult = await query(
      `SELECT rl.*, u.name, u.avatar_url,
         p.title as property_title, p.address,
         (SELECT url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as property_image
       FROM roommate_listings rl
       JOIN users u ON rl.user_id = u.id
       LEFT JOIN properties p ON rl.property_id = p.id
       WHERE rl.type = 'offering' AND rl.status = 'active'
       ORDER BY rl.created_at DESC
       LIMIT 20`
    );
    offeringRoom = offeringResult.rows;
  } catch (err) {
    console.error("Roommate query error:", err);
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">👥 Roommates</h1>
            <p className="text-gray-500 text-sm">Find a roommate or share your space</p>
          </div>
          {!userListing && (
            <Link
              href="/renter/roommates/new"
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition inline-flex items-center gap-2"
            >
              <span>➕</span> Post a Listing
            </Link>
          )}
        </div>

        {/* User's Active Listing */}
        {userListing && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-medium mb-1">YOUR LISTING</p>
                <h3 className="font-bold text-lg">{userListing.title}</h3>
                <p className="text-gray-600 text-sm">
                  {userListing.type === "looking" ? "🔍 Looking for a room" : "🏠 Offering a room"} in {userListing.city}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/renter/roommates/${userListing.id}/edit`}
                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Edit
                </Link>
                <Link
                  href={`/renter/roommates/${userListing.id}`}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Looking for a Room */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">Looking for a Room</h2>
                <p className="text-gray-500 text-sm">People searching for a place</p>
              </div>
            </div>
            
            {lookingForRoom.length > 0 ? (
              <div className="space-y-3">
                {lookingForRoom.slice(0, 5).map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/renter/roommates/${listing.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                  >
                    {listing.avatar_url ? (
                      <img src={listing.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {listing.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.name}</p>
                      <p className="text-sm text-gray-500">
                        {listing.city} • Budget: {listing.budget_min && listing.budget_max 
                          ? `${formatPrice(listing.budget_min)} - ${formatPrice(listing.budget_max)}`
                          : "Flexible"}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                ))}
                {lookingForRoom.length > 5 && (
                  <Link href="/renter/roommates/search?type=looking" className="block text-center text-primary text-sm font-medium hover:underline py-2">
                    View all {lookingForRoom.length} listings →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No listings yet</p>
            )}
          </div>

          {/* Offering a Room */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">Offering a Room</h2>
                <p className="text-gray-500 text-sm">Rooms available to share</p>
              </div>
            </div>
            
            {offeringRoom.length > 0 ? (
              <div className="space-y-3">
                {offeringRoom.slice(0, 5).map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/renter/roommates/${listing.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                  >
                    {listing.property_image ? (
                      <img src={listing.property_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                        🏠
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.title}</p>
                      <p className="text-sm text-gray-500">
                        {listing.city} • {listing.rent_amount ? formatPrice(listing.rent_amount) + "/mo" : "Contact for price"}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                ))}
                {offeringRoom.length > 5 && (
                  <Link href="/renter/roommates/search?type=offering" className="block text-center text-primary text-sm font-medium hover:underline py-2">
                    View all {offeringRoom.length} listings →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No rooms available</p>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h2 className="font-bold text-lg mb-4">💡 How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Create a Listing</h3>
              <p className="text-sm text-gray-500">
                Tell us if you're looking for a room or offering one to share
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Get Matched</h3>
              <p className="text-sm text-gray-500">
                Browse compatible roommates or rooms that match your preferences
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3️⃣</span>
              </div>
              <h3 className="font-semibold mb-1">Connect & Move In</h3>
              <p className="text-sm text-gray-500">
                Chat with potential roommates and find your perfect match
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
