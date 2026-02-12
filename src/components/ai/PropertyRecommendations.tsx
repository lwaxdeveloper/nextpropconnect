"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface Property {
  id: number;
  title: string;
  type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  suburb: string;
  city: string;
  images: string[];
  listing_type: string;
}

interface RecommendationsResponse {
  recommendations: Property[];
  reason: string;
  personalized: boolean;
}

export default function PropertyRecommendations() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/ai/recommendations");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <SparklesIcon className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-xl font-bold text-dark">Finding recommendations...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || data.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <SparklesIcon className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-dark">
          {data.personalized ? "Recommended for You" : "Featured Properties"}
        </h2>
        {data.personalized && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
            AI Powered
          </span>
        )}
      </div>
      <p className="text-gray-600 mb-4 text-sm">{data.reason}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.recommendations.map((property) => (
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
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
