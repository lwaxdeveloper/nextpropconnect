"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

const SA_PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

const PROPERTY_TYPES = [
  "House",
  "Apartment",
  "Townhouse",
  "Farm",
  "Land",
  "Commercial",
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const get = (key: string) => searchParams.get(key) || "";

  const [filters, setFilters] = useState({
    search: get("search"),
    listing_type: get("listing_type"),
    property_type: get("property_type"),
    min_price: get("min_price"),
    max_price: get("max_price"),
    bedrooms: get("bedrooms"),
    bathrooms: get("bathrooms"),
    province: get("province"),
    city: get("city"),
    suburb: get("suburb"),
  });

  const apply = useCallback(
    (overrides?: Record<string, string>) => {
      const merged = { ...filters, ...overrides };
      const params = new URLSearchParams();
      Object.entries(merged).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.delete("page"); // reset page on filter change
      router.push(`/properties?${params.toString()}`);
    },
    [filters, router]
  );

  const set = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAll = () => {
    router.push("/properties");
    setFilters({
      search: "",
      listing_type: "",
      property_type: "",
      min_price: "",
      max_price: "",
      bedrooms: "",
      bathrooms: "",
      province: "",
      city: "",
      suburb: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  const filterContent = (
    <div className="space-y-5">
      {/* Listing Type */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Listing Type
        </label>
        <div className="flex gap-2">
          {[
            { value: "", label: "All" },
            { value: "sale", label: "For Sale" },
            { value: "rent", label: "To Rent" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                set("listing_type", opt.value);
                apply({ listing_type: opt.value });
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.listing_type === opt.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Property Type
        </label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((pt) => {
            const newVal = filters.property_type === pt.toLowerCase() ? "" : pt.toLowerCase();
            return (
              <button
                key={pt}
                type="button"
                onClick={() => {
                  set("property_type", newVal);
                  apply({ property_type: newVal });
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filters.property_type === pt.toLowerCase()
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {pt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => set("min_price", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <span className="flex items-center text-gray-400 text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => set("max_price", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Bedrooms
        </label>
        <div className="flex gap-2">
          {["", "1", "2", "3", "4", "5"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                set("bedrooms", v);
                apply({ bedrooms: v });
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.bedrooms === v
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {v === "" ? "Any" : v === "5" ? "5+" : v}
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Bathrooms
        </label>
        <div className="flex gap-2">
          {["", "1", "2", "3"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                set("bathrooms", v);
                apply({ bathrooms: v });
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.bathrooms === v
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {v === "" ? "Any" : v === "3" ? "3+" : v}
            </button>
          ))}
        </div>
      </div>

      {/* Province */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Province
        </label>
        <select
          value={filters.province}
          onChange={(e) => set("province", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
        >
          <option value="">All Provinces</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          City
        </label>
        <input
          type="text"
          placeholder="e.g. Johannesburg"
          value={filters.city}
          onChange={(e) => set("city", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      {/* Suburb */}
      <div>
        <label className="text-sm font-semibold text-dark block mb-2">
          Suburb
        </label>
        <input
          type="text"
          placeholder="e.g. Sandton"
          value={filters.suburb}
          onChange={(e) => set("suburb", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => apply()}
          className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-dark border border-gray-200 hover:border-gray-300 transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Search Bar — always visible */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by title, suburb, city..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <button
          onClick={() => apply()}
          className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition hidden sm:block"
        >
          Search
        </button>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 8a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 8a1 1 0 011-1h10a1 1 0 010 2H4a1 1 0 01-1-1z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Desktop sidebar filters */}
      <div className="hidden lg:block">{filterContent}</div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-dark">Filters</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-dark"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
