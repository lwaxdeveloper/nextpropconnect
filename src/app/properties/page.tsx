import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyGrid from "@/components/PropertyGrid";
import SearchFilters from "@/components/SearchFilters";
import Pagination from "@/components/Pagination";
import SaveSearchButton from "@/components/SaveSearchButton";
import AISearchResults from "@/components/AISearchResults";
import { AISearchBar } from "@/components/ai";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Properties — NextPropConnect SA",
  description:
    "Find your next home in South Africa. Browse houses, apartments, and more for sale and to rent across all provinces.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function PropertyResults({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const sp = searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const limit = 12;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["p.status = 'active'"];
  const params: unknown[] = [];
  let idx = 1;

  if (sp.listing_type) {
    conditions.push(`p.listing_type = $${idx++}`);
    params.push(sp.listing_type);
  }
  if (sp.property_type) {
    conditions.push(`p.property_type = $${idx++}`);
    params.push(sp.property_type);
  }
  if (sp.min_price) {
    conditions.push(`p.price >= $${idx++}`);
    params.push(parseFloat(sp.min_price));
  }
  if (sp.max_price) {
    conditions.push(`p.price <= $${idx++}`);
    params.push(parseFloat(sp.max_price));
  }
  if (sp.bedrooms) {
    const v = parseInt(sp.bedrooms);
    conditions.push(v >= 5 ? `p.bedrooms >= $${idx++}` : `p.bedrooms = $${idx++}`);
    params.push(v);
  }
  if (sp.bathrooms) {
    const v = parseInt(sp.bathrooms);
    conditions.push(v >= 3 ? `p.bathrooms >= $${idx++}` : `p.bathrooms = $${idx++}`);
    params.push(v);
  }
  if (sp.province) {
    conditions.push(`p.province ILIKE $${idx++}`);
    params.push(sp.province);
  }
  if (sp.city) {
    conditions.push(`p.city ILIKE $${idx++}`);
    params.push(`%${sp.city}%`);
  }
  if (sp.suburb) {
    conditions.push(`p.suburb ILIKE $${idx++}`);
    params.push(`%${sp.suburb}%`);
  }
  if (sp.search) {
    conditions.push(
      `(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR p.suburb ILIKE $${idx} OR p.city ILIKE $${idx})`
    );
    params.push(`%${sp.search}%`);
    idx++;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  let orderBy = "p.is_featured DESC, p.created_at DESC";
  if (sp.sort === "price_asc") orderBy = "p.price ASC";
  else if (sp.sort === "price_desc") orderBy = "p.price DESC";

  const countResult = await query(
    `SELECT COUNT(*) FROM properties p ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  const result = await query(
    `SELECT p.*,
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
    FROM properties p
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return (
    <>
      {/* Sort + result count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {total} {total === 1 ? "property" : "properties"} found
        </p>
        <SortSelect current={sp.sort || "newest"} searchParams={sp} />
      </div>
      <div className="mb-6">
        <Suspense fallback={null}>
          <SaveSearchButton />
        </Suspense>
      </div>

      <PropertyGrid properties={result.rows} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/properties"
        searchParams={sp}
      />
    </>
  );
}

function SortSelect({
  current,
  searchParams,
}: {
  current: string;
  searchParams: Record<string, string>;
}) {
  const options = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 hidden sm:inline">Sort:</span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const params = new URLSearchParams(searchParams);
          params.set("sort", opt.value);
          params.delete("page");
          return (
            <a
              key={opt.value}
              href={`/properties?${params.toString()}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                current === opt.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default async function PropertiesPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  // Flatten searchParams — take first value if array
  const sp: Record<string, string> = {};
  Object.entries(resolvedParams).forEach(([k, v]) => {
    if (typeof v === "string") sp[k] = v;
    else if (Array.isArray(v) && v.length > 0) sp[k] = v[0];
  });

  const aiQuery = sp.ai || "";

  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              Browse Properties
            </h1>
            <p className="text-gray-500 mt-1">
              Find your next home across South Africa
            </p>
            {/* AI Search Bar */}
            <div className="mt-4 max-w-2xl">
              <AISearchBar placeholder="Try AI search: 3 bed house in Sandton under 3M" />
            </div>
          </div>

          {aiQuery ? (
            // AI Search Results
            <AISearchResults aiQuery={aiQuery} />
          ) : (
            <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
              {/* Filters sidebar */}
              <aside className="mb-6 lg:mb-0">
                <Suspense fallback={null}>
                  <SearchFilters />
                </Suspense>
              </aside>

              {/* Results */}
              <div>
                <Suspense
                  fallback={
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                        >
                          <div className="aspect-[4/3] bg-gray-200" />
                          <div className="p-4 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-2/3" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <PropertyResults searchParams={sp} />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
