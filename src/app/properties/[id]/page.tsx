import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import AgentCard from "@/components/AgentCard";
import PropertyGrid from "@/components/PropertyGrid";
import StatusBadge from "@/components/StatusBadge";
import PropertyMap from "@/components/PropertyMap";
import { formatPrice } from "@/lib/format";
import ShareButton from "./ShareButton";
import OwnerContactCard from "./OwnerContactCard";
import { query } from "@/lib/db";
import { PropertyJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProperty(id: number) {
  // Increment views
  await query(
    "UPDATE properties SET views_count = views_count + 1 WHERE id = $1",
    [id]
  );

  const result = await query(
    `SELECT p.*,
      u.name as user_name, u.avatar_url as user_avatar, u.phone as user_phone,
      ap.id as agent_profile_id, ap.agency_name, ap.trust_score, ap.is_verified as agent_verified,
      ap.bio as agent_bio, ap.eaab_number, ap.ffc_number, ap.areas_served, ap.specializations,
      ap.commission_rate, ap.years_experience,
      au.name as agent_name, au.avatar_url as agent_avatar, au.phone as agent_phone, au.id as agent_user_id
    FROM properties p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN agent_profiles ap ON p.agent_id = ap.id
    LEFT JOIN users au ON ap.user_id = au.id
    WHERE p.id = $1 AND p.status != 'deleted'`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const images = await query(
    "SELECT * FROM property_images WHERE property_id = $1 ORDER BY category, is_primary DESC, sort_order ASC",
    [id]
  );

  const prop = result.rows[0];
  const priceRange = Number(prop.price) * 0.3;
  const similar = await query(
    `SELECT p.*,
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
    FROM properties p
    WHERE p.id != $1 AND p.status = 'active' AND p.listing_type = $2
      AND (p.suburb ILIKE $3 OR p.city ILIKE $4)
      AND p.price BETWEEN $5 AND $6
    ORDER BY CASE WHEN p.suburb ILIKE $3 THEN 0 ELSE 1 END, ABS(p.price - $7)
    LIMIT 4`,
    [id, prop.listing_type, prop.suburb || "___NOMATCH___", prop.city,
      Number(prop.price) - priceRange, Number(prop.price) + priceRange, Number(prop.price)]
  );

  return { property: prop, images: images.rows, similar: similar.rows };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const propertyId = parseInt(id);
  if (isNaN(propertyId)) return { title: "Property Not Found" };

  const result = await query(
    "SELECT title, description, suburb, city, price, listing_type FROM properties WHERE id = $1",
    [propertyId]
  );
  if (result.rows.length === 0) return { title: "Property Not Found" };

  const p = result.rows[0];
  const priceStr = formatPrice(Number(p.price));
  const location = [p.suburb, p.city].filter(Boolean).join(", ");

  return {
    title: `${p.title} — ${priceStr} | NextPropConnect SA`,
    description: p.description?.slice(0, 160) || `${p.title} in ${location} for ${priceStr}`,
    openGraph: {
      title: `${p.title} — ${priceStr}`,
      description: `${p.listing_type === "rent" ? "To Rent" : "For Sale"} in ${location}`,
      url: `https://nextpropconnect.co.za/properties/${propertyId}`,
      siteName: "NextPropConnect SA",
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const propertyId = parseInt(id);
  if (isNaN(propertyId)) notFound();

  const data = await getProperty(propertyId);
  if (!data) notFound();

  const { property: p, images, similar } = data;
  const price = Number(p.price);

  const location = [p.suburb, p.city].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-light">
      <PropertyJsonLd
        property={{
          id: p.id,
          title: p.title,
          description: p.description || "",
          price: price,
          property_type: p.property_type,
          listing_type: p.listing_type,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          size_sqm: p.size_sqm,
          location: location,
          images: images.map((img: any) => img.url),
          agent_name: p.agent_name || p.user_name,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://nextpropconnect.co.za" },
          { name: "Properties", url: "https://nextpropconnect.co.za/properties" },
          { name: p.title, url: `https://nextpropconnect.co.za/properties/${p.id}` },
        ]}
      />
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-400">
            <Link href="/properties" className="hover:text-primary transition">
              Properties
            </Link>
            <span className="mx-2">›</span>
            <span className="text-dark">{p.title}</span>
          </nav>

          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
            {/* Left column */}
            <div>
              {/* Gallery */}
              <ImageGallery images={images} />

              {/* Header */}
              <div className="mt-6 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={p.status} listingType={p.listing_type} size="md" />
                  <span className="text-xs text-gray-400 capitalize">
                    {p.property_type}
                  </span>
                  {p.is_featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-dark mb-2">
                  {p.title}
                </h1>
                <div className="text-3xl font-bold text-dark">
                  {formatPrice(price)}
                  {p.listing_type === "rent" && (
                    <span className="text-base font-normal text-gray-500"> /month</span>
                  )}
                </div>
              </div>

              {/* Stats bar */}
              <div className="flex flex-wrap gap-4 sm:gap-6 p-4 bg-white rounded-2xl border border-gray-100 mb-6">
                {p.bedrooms != null && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-dark">{p.bedrooms}</div>
                    <div className="text-xs text-gray-500">Bedrooms</div>
                  </div>
                )}
                {p.bathrooms != null && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-dark">{p.bathrooms}</div>
                    <div className="text-xs text-gray-500">Bathrooms</div>
                  </div>
                )}
                {p.garages != null && p.garages > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-dark">{p.garages}</div>
                    <div className="text-xs text-gray-500">Garages</div>
                  </div>
                )}
                {p.floor_size && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-dark">{Number(p.floor_size)}</div>
                    <div className="text-xs text-gray-500">m² floor</div>
                  </div>
                )}
                {p.erf_size && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-dark">{Number(p.erf_size)}</div>
                    <div className="text-xs text-gray-500">m² erf</div>
                  </div>
                )}
                {p.year_built && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-dark">{p.year_built}</div>
                    <div className="text-xs text-gray-500">Built</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {p.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-dark mb-3">Description</h2>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {p.description}
                  </div>
                </div>
              )}

              {/* Features */}
              {(p.has_pool || p.has_garden || p.has_security || p.has_pet_friendly || p.is_furnished) && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-dark mb-3">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {p.has_pool && (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm">🏊 Swimming Pool</span>
                    )}
                    {p.has_garden && (
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-sm">🌳 Garden</span>
                    )}
                    {p.has_security && (
                      <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-sm">🔒 Security</span>
                    )}
                    {p.has_pet_friendly && (
                      <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-sm">🐾 Pet Friendly</span>
                    )}
                    {p.is_furnished && (
                      <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-xl text-sm">🛋️ Furnished</span>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-dark mb-3">Location</h2>
                <p className="text-sm text-gray-600 mb-3">
                  📍 {[p.street_address, p.suburb, p.city, p.province].filter(Boolean).join(", ")}
                  {p.postal_code && `, ${p.postal_code}`}
                </p>
                <PropertyMap
                  address={p.street_address || ""}
                  suburb={p.suburb || ""}
                  city={p.city || ""}
                  province={p.province || ""}
                  latitude={p.latitude ? Number(p.latitude) : null}
                  longitude={p.longitude ? Number(p.longitude) : null}
                />
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Share + views */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  👁️ {p.views_count} views
                </span>
                <ShareButton />
              </div>

              {/* Agent or Owner card */}
              {p.agent_profile_id ? (
                <AgentCard
                  agent={{
                    id: p.agent_profile_id,
                    user_id: p.agent_user_id,
                    name: p.agent_name,
                    avatar_url: p.agent_avatar,
                    phone: p.agent_phone,
                    agency_name: p.agency_name,
                    trust_score: p.trust_score,
                    is_verified: p.agent_verified,
                  }}
                  propertyId={p.id}
                  propertyTitle={p.title}
                />
              ) : (
                <OwnerContactCard
                  userId={p.user_id}
                  userName={p.user_name}
                  userAvatar={p.user_avatar}
                  userPhone={p.user_phone}
                  propertyId={p.id}
                  propertyTitle={p.title}
                />
              )}

              {/* Quick info card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 text-sm space-y-3">
                <h3 className="font-bold text-dark">Quick Info</h3>
                <div className="flex justify-between">
                  <span className="text-gray-500">Listing Type</span>
                  <span className="font-medium text-dark capitalize">{p.listing_type === "sale" ? "For Sale" : "To Rent"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Property Type</span>
                  <span className="font-medium text-dark capitalize">{p.property_type}</span>
                </div>
                {p.parking_spaces != null && p.parking_spaces > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Parking</span>
                    <span className="font-medium text-dark">{p.parking_spaces} spaces</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Listed</span>
                  <span className="font-medium text-dark">
                    {new Date(p.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {p.price_negotiable && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-medium text-green-600">Negotiable</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Properties */}
          {similar.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-dark mb-6">
                Similar Properties Nearby
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {similar.map((sp: any) => (
                  <Link key={sp.id} href={`/properties/${sp.id}`} className="group block">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition h-full">
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {sp.image_url ? (
                          <img
                            src={sp.image_url}
                            alt={sp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-dark text-sm">
                          {formatPrice(Number(sp.price))}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {sp.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          📍 {[sp.suburb, sp.city].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
