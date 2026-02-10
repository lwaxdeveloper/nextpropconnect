"use client";

import { useState, useRef } from "react";
import { Download, Share2, Printer } from "lucide-react";

interface Listing {
  id: number;
  title: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  suburb?: string;
  city?: string;
  property_type: string;
  listing_type: string;
  floor_size?: number;
  erf_size?: number;
  has_pool?: boolean;
  has_garden?: boolean;
  has_security?: boolean;
  description?: string;
  image_url?: string;
  images?: string[];
}

interface Agent {
  name: string;
  phone: string;
  email: string;
  agency: string;
}

interface Props {
  listings: Listing[];
  agent: Agent;
}

function formatPrice(price: number): string {
  return `R ${price.toLocaleString("en-ZA")}`;
}

export default function FlyerGenerator({ listings, agent }: Props) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [template, setTemplate] = useState<"modern" | "classic" | "minimal">("modern");
  const flyerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!selectedListing) return;
    
    const shareData = {
      title: selectedListing.title,
      text: `${selectedListing.listing_type === "rent" ? "TO RENT" : "FOR SALE"}: ${selectedListing.title} - ${formatPrice(selectedListing.price)}${selectedListing.listing_type === "rent" ? "/month" : ""}`,
      url: `https://nextnextpropconnect.co.za/properties/${selectedListing.id}`,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert("Link copied to clipboard!");
    }
  };

  const priceLabel = selectedListing
    ? selectedListing.listing_type === "rent"
      ? `${formatPrice(selectedListing.price)}/month`
      : formatPrice(selectedListing.price)
    : "";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Listing Selector */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-dark mb-4">Select Listing</h2>
          
          {listings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏠</div>
              <p>No active listings</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                    selectedListing?.id === listing.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="w-16 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">🏠</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark text-sm truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(listing.price)}{listing.listing_type === "rent" ? "/mo" : ""} • {listing.suburb}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-dark mb-4">Choose Template</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "modern", label: "Modern", color: "from-blue-600 to-blue-800" },
              { key: "classic", label: "Classic", color: "from-gray-700 to-gray-900" },
              { key: "minimal", label: "Minimal", color: "from-white to-gray-100" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key as typeof template)}
                className={`p-3 rounded-xl border-2 transition ${
                  template === t.key
                    ? "border-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`h-12 rounded-lg bg-gradient-to-br ${t.color} mb-2`} />
                <p className="text-xs font-medium text-center">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {selectedListing && (
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-dark text-white rounded-xl font-semibold hover:bg-dark/90 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        )}
      </div>

      {/* Flyer Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark mb-4">Preview</h2>
        
        {!selectedListing ? (
          <div className="aspect-[3/4] bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">👈</div>
              <p>Select a listing</p>
            </div>
          </div>
        ) : (
          <div
            ref={flyerRef}
            className={`aspect-[3/4] rounded-xl overflow-hidden shadow-lg print:shadow-none ${
              template === "modern"
                ? "bg-gradient-to-br from-blue-600 to-blue-800"
                : template === "classic"
                ? "bg-gradient-to-br from-gray-800 to-gray-900"
                : "bg-white border"
            }`}
          >
            {/* Image */}
            <div className="h-1/2 relative">
              {selectedListing.image_url ? (
                <img
                  src={selectedListing.image_url}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-6xl">
                  🏠
                </div>
              )}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold ${
                selectedListing.listing_type === "rent"
                  ? "bg-purple-500 text-white"
                  : "bg-green-500 text-white"
              }`}>
                {selectedListing.listing_type === "rent" ? "TO RENT" : "FOR SALE"}
              </div>
            </div>

            {/* Content */}
            <div className={`h-1/2 p-5 flex flex-col ${
              template === "minimal" ? "text-gray-900" : "text-white"
            }`}>
              <h3 className="text-lg font-bold leading-tight mb-1">
                {selectedListing.title}
              </h3>
              <p className={`text-sm mb-2 ${template === "minimal" ? "text-gray-500" : "opacity-80"}`}>
                📍 {selectedListing.suburb}, {selectedListing.city}
              </p>
              
              <p className="text-2xl font-black mb-3">{priceLabel}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedListing.bedrooms && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template === "minimal" ? "bg-gray-100" : "bg-white/20"
                  }`}>
                    🛏️ {selectedListing.bedrooms} beds
                  </span>
                )}
                {selectedListing.bathrooms && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template === "minimal" ? "bg-gray-100" : "bg-white/20"
                  }`}>
                    🚿 {selectedListing.bathrooms} baths
                  </span>
                )}
                {selectedListing.floor_size && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template === "minimal" ? "bg-gray-100" : "bg-white/20"
                  }`}>
                    📐 {selectedListing.floor_size}m²
                  </span>
                )}
                {selectedListing.has_pool && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template === "minimal" ? "bg-gray-100" : "bg-white/20"
                  }`}>
                    🏊 Pool
                  </span>
                )}
              </div>

              {/* Agent Info */}
              <div className="mt-auto pt-3 border-t border-white/20">
                <p className="font-semibold text-sm">{agent.name}</p>
                {agent.agency && (
                  <p className={`text-xs ${template === "minimal" ? "text-gray-500" : "opacity-70"}`}>
                    {agent.agency}
                  </p>
                )}
                <p className={`text-xs ${template === "minimal" ? "text-gray-600" : "opacity-90"}`}>
                  📞 {agent.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Tip: Use Print → Save as PDF for best quality
        </p>
      </div>
    </div>
  );
}
