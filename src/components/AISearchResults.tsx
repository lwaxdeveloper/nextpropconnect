"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Property {
  id: number;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  suburb: string;
  city: string;
  listing_type: string;
  images: string[];
}

interface ParsedParams {
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  location?: string;
  listingType?: string;
}

interface AISearchResultsProps {
  aiQuery: string;
}

export default function AISearchResults({ aiQuery }: AISearchResultsProps) {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [parsed, setParsed] = useState<ParsedParams | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (aiQuery) {
      searchAI(aiQuery);
    }
  }, [aiQuery]);

  const searchAI = async (query: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setProperties(data.properties || []);
      setParsed(data.parsed || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === "rent" ? `${formatted}/mo` : formatted;
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center gap-3 text-primary">
          <SparklesIcon className="h-6 w-6 animate-pulse" />
          <span className="text-lg font-medium">AI is searching...</span>
        </div>
        <p className="text-gray-500 mt-2">Analyzing: &quot;{aiQuery}&quot;</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/properties" className="text-primary hover:underline mt-2 inline-block">
          Try regular search
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* AI Search Info */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-purple-100 rounded-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold mb-1">
              <SparklesIcon className="h-5 w-5" />
              AI Search Results
            </div>
            <p className="text-sm text-gray-600">
              Searched for: &quot;{aiQuery}&quot;
            </p>
            {parsed && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parsed.bedrooms && (
                  <span className="px-2 py-1 bg-white rounded-lg text-xs">
                    {parsed.bedrooms}+ beds
                  </span>
                )}
                {parsed.bathrooms && (
                  <span className="px-2 py-1 bg-white rounded-lg text-xs">
                    {parsed.bathrooms}+ baths
                  </span>
                )}
                {parsed.propertyType && (
                  <span className="px-2 py-1 bg-white rounded-lg text-xs capitalize">
                    {parsed.propertyType}
                  </span>
                )}
                {parsed.location && (
                  <span className="px-2 py-1 bg-white rounded-lg text-xs">
                    📍 {parsed.location}
                  </span>
                )}
                {parsed.maxPrice && (
                  <span className="px-2 py-1 bg-white rounded-lg text-xs">
                    Under R{(parsed.maxPrice / 1000000).toFixed(1)}M
                  </span>
                )}
                {parsed.listingType && (
                  <span className="px-2 py-1 bg-white rounded-lg text-xs capitalize">
                    For {parsed.listingType}
                  </span>
                )}
              </div>
            )}
          </div>
          <Link
            href="/properties"
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </Link>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-gray-500 mb-4">
        {properties.length} {properties.length === 1 ? "property" : "properties"} found
      </p>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No properties match your search.</p>
          <Link
            href="/properties"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Browse All Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border"
            >
              <div className="relative h-48">
                {property.images && property.images[0] ? (
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium">
                    {property.listing_type === "rent" ? "For Rent" : "For Sale"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-primary text-lg">
                  {formatPrice(property.price, property.listing_type)}
                </p>
                <h3 className="font-semibold text-dark truncate">{property.title}</h3>
                <p className="text-sm text-gray-500">
                  {property.suburb}, {property.city}
                </p>
                <div className="flex gap-3 mt-2 text-sm text-gray-600">
                  <span>{property.bedrooms} beds</span>
                  <span>{property.bathrooms} baths</span>
                  <span className="capitalize">{property.property_type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
