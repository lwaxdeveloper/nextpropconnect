import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingForm from "@/components/ListingForm";
import type { ListingFormData } from "@/components/ListingForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const propertyId = parseInt(id);
  if (isNaN(propertyId)) notFound();

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  const result = await query(
    "SELECT * FROM properties WHERE id = $1 AND status != 'deleted'",
    [propertyId]
  );
  if (result.rows.length === 0) notFound();

  const p = result.rows[0];
  if (p.user_id !== userId) {
    redirect("/dashboard");
  }

  const images = await query(
    "SELECT id, url, alt_text, category FROM property_images WHERE property_id = $1 ORDER BY category, is_primary DESC, sort_order ASC",
    [propertyId]
  );

  const initialData: Partial<ListingFormData> = {
    title: p.title,
    listing_type: p.listing_type,
    property_type: p.property_type,
    street_address: p.street_address || "",
    suburb: p.suburb || "",
    city: p.city,
    province: p.province,
    postal_code: p.postal_code || "",
    price: String(Number(p.price)),
    bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
    bathrooms: p.bathrooms != null ? String(p.bathrooms) : "",
    garages: p.garages != null ? String(p.garages) : "",
    parking_spaces: p.parking_spaces != null ? String(p.parking_spaces) : "",
    floor_size: p.floor_size ? String(Number(p.floor_size)) : "",
    erf_size: p.erf_size ? String(Number(p.erf_size)) : "",
    year_built: p.year_built != null ? String(p.year_built) : "",
    has_pool: p.has_pool || false,
    has_garden: p.has_garden || false,
    has_security: p.has_security || false,
    has_pet_friendly: p.has_pet_friendly || false,
    is_furnished: p.is_furnished || false,
    description: p.description || "",
    status: p.status,
  };

  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              Edit Listing
            </h1>
            <p className="text-gray-500 mt-1">
              Update your property details below.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <ListingForm
              initialData={initialData}
              propertyId={propertyId}
              existingImages={images.rows}
            />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
