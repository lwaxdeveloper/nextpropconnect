import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RoommateListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");
  const { id } = await params;
  const listingId = parseInt(id);

  // Fetch listing
  const result = await query(
    `SELECT rl.*, u.id as owner_id, u.name, u.avatar_url, u.email, u.phone,
       p.title as property_title, p.address, p.city as property_city,
       (SELECT url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as property_image
     FROM roommate_listings rl
     JOIN users u ON rl.user_id = u.id
     LEFT JOIN properties p ON rl.property_id = p.id
     WHERE rl.id = $1`,
    [listingId]
  );

  if (result.rows.length === 0) {
    notFound();
  }

  const listing = result.rows[0];
  const isOwner = listing.owner_id === userId;

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/renter/roommates" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Roommates
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                    listing.type === "looking" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {listing.type === "looking" ? "🔍 Looking for Room" : "🏠 Offering Room"}
                  </span>
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  <p className="text-gray-500">
                    📍 {listing.area ? `${listing.area}, ` : ""}{listing.city}, {listing.province}
                  </p>
                </div>
                {isOwner && (
                  <Link
                    href={`/renter/roommates/${listing.id}/edit`}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Edit
                  </Link>
                )}
              </div>

              {/* Price/Budget */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                {listing.type === "looking" ? (
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="text-2xl font-bold text-primary">
                      {listing.budget_min && listing.budget_max 
                        ? `${formatPrice(listing.budget_min)} - ${formatPrice(listing.budget_max)}`
                        : listing.budget_max 
                        ? `Up to ${formatPrice(listing.budget_max)}`
                        : "Flexible"
                      }
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </p>
                    {listing.move_in_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        Move-in: {new Date(listing.move_in_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Rent</p>
                    <p className="text-2xl font-bold text-primary">
                      {listing.rent_amount ? formatPrice(listing.rent_amount) : "Contact for price"}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </p>
                    {listing.deposit_amount && (
                      <p className="text-sm text-gray-500 mt-1">
                        Deposit: {formatPrice(listing.deposit_amount)}
                      </p>
                    )}
                    {listing.available_from && (
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {new Date(listing.available_from).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-sm max-w-none">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="whitespace-pre-line text-gray-700">{listing.description}</p>
              </div>
            </div>

            {/* Room Features (for offering) */}
            {listing.type === "offering" && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4">Room Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${listing.is_furnished ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span className="text-2xl block mb-1">🛋️</span>
                    <span className="font-medium">{listing.is_furnished ? 'Furnished' : 'Unfurnished'}</span>
                  </div>
                  <div className={`p-4 rounded-xl ${listing.has_own_bathroom ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span className="text-2xl block mb-1">🚿</span>
                    <span className="font-medium">{listing.has_own_bathroom ? 'Private Bathroom' : 'Shared Bathroom'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Preferences</h3>
              <div className="flex flex-wrap gap-3">
                {listing.preferred_gender && (
                  <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    {listing.preferred_gender === 'male' ? '👨 Male preferred' : '👩 Female preferred'}
                  </span>
                )}
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${listing.smoker_friendly ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  🚬 {listing.smoker_friendly ? 'Smoker friendly' : 'Non-smoker'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${listing.pet_friendly ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  🐾 {listing.pet_friendly ? 'Pet friendly' : 'No pets'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${listing.couples_ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  💑 {listing.couples_ok ? 'Couples OK' : 'Singles only'}
                </span>
              </div>
            </div>

            {/* About the person */}
            {(listing.about_me || listing.my_occupation || listing.lifestyle) && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4">About {listing.name}</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  {listing.my_age && (
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
                      🎂 {listing.my_age} years old
                    </span>
                  )}
                  {listing.my_gender && (
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
                      {listing.my_gender === 'male' ? '👨' : listing.my_gender === 'female' ? '👩' : '🧑'} {listing.my_gender}
                    </span>
                  )}
                  {listing.my_occupation && (
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
                      💼 {listing.my_occupation}
                    </span>
                  )}
                </div>
                {listing.about_me && (
                  <p className="text-gray-700 whitespace-pre-line">{listing.about_me}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
              <div className="flex items-center gap-4 mb-4">
                {listing.avatar_url ? (
                  <img src={listing.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-2xl font-bold">
                    {listing.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg">{listing.name}</p>
                  <p className="text-sm text-gray-500">
                    {listing.type === "looking" ? "Looking for a room" : "Offering a room"}
                  </p>
                </div>
              </div>

              {!isOwner && (
                <div className="space-y-3">
                  <Link
                    href={`/messages?to=${listing.owner_id}`}
                    className="block w-full py-3 bg-primary text-white rounded-xl font-semibold text-center hover:bg-primary/90 transition"
                  >
                    💬 Send Message
                  </Link>
                  {listing.phone && (
                    <a
                      href={`tel:${listing.phone}`}
                      className="block w-full py-3 bg-green-500 text-white rounded-xl font-semibold text-center hover:bg-green-600 transition"
                    >
                      📞 Call
                    </a>
                  )}
                  {listing.phone && (
                    <a
                      href={`https://wa.me/${listing.phone.replace(/\D/g, '')}?text=Hi, I saw your roommate listing "${listing.title}" on PropConnect`}
                      target="_blank"
                      className="block w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold text-center hover:opacity-90 transition"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Property Card (for offering) */}
            {listing.type === "offering" && listing.property_title && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden">
                {listing.property_image && (
                  <img src={listing.property_image} alt="" className="w-full aspect-video object-cover" />
                )}
                <div className="p-4">
                  <h4 className="font-semibold mb-1">{listing.property_title}</h4>
                  <p className="text-sm text-gray-500">{listing.address}, {listing.property_city}</p>
                </div>
              </div>
            )}

            {/* Report */}
            {!isOwner && (
              <button className="w-full text-sm text-gray-400 hover:text-red-500 transition">
                🚩 Report this listing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
