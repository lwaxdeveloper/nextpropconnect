"use client";

import Link from "next/link";
import { formatPrice } from "./PriceDisplay";

export interface PropertyCardData {
  id: number;
  title: string;
  price: number;
  listing_type: string;
  property_type: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  floor_size: number | null;
  suburb: string | null;
  city: string;
  province: string;
  image_url: string | null;
  is_featured: boolean;
  is_verified?: boolean;
  agent_name?: string;
}

export default function PropertyCard({ property }: { property: PropertyCardData }) {
  const p = property;

  return (
    <Link href={`/properties/${p.id}`} className="group block h-full">
      <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {/* Listing type badge */}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              p.listing_type === "rent" 
                ? "bg-secondary text-secondary-foreground" 
                : "bg-primary text-primary-foreground"
            }`}>
              For {p.listing_type === "rent" ? "Rent" : "Sale"}
            </span>
            
            {/* Verified badge */}
            {p.is_verified && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            
            {/* Featured badge */}
            {p.is_featured && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Property type pill */}
          <div className="absolute bottom-3 right-3">
            <span className="px-2.5 py-1 text-xs font-medium bg-background/90 backdrop-blur-sm text-foreground rounded-full">
              {p.property_type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Price */}
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-heading font-bold text-foreground">
              {formatPrice(p.price)}
            </span>
            {p.listing_type === "rent" && (
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">
            {p.title}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {p.bedrooms != null && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {p.bedrooms} bed
              </span>
            )}
            {p.bathrooms != null && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {p.bathrooms} bath
              </span>
            )}
            {p.garages != null && p.garages > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10" />
                </svg>
                {p.garages} park
              </span>
            )}
            {p.floor_size && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {p.floor_size}m²
              </span>
            )}
          </div>

          {/* Location */}
          <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{[p.suburb, p.city].filter(Boolean).join(", ")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
