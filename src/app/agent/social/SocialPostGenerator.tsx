"use client";

import { useState } from "react";

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
  has_pool?: boolean;
  has_garden?: boolean;
  has_security?: boolean;
  floor_size?: number;
  image_url?: string;
}

interface Props {
  listings: Listing[];
  agentName: string;
  agentPhone: string;
  agencyName: string;
  enableWhatsapp: boolean;
}

function formatPrice(price: number): string {
  return `R ${price.toLocaleString("en-ZA")}`;
}

export default function SocialPostGenerator({
  listings,
  agentName,
  agentPhone,
  agencyName,
}: Props) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "whatsapp">("facebook");
  const [copied, setCopied] = useState(false);

  const generatePost = (listing: Listing, platform: string): string => {
    const emoji = listing.listing_type === "rent" ? "🏠" : "🏡";
    const action = listing.listing_type === "rent" ? "TO RENT" : "FOR SALE";
    const priceStr = formatPrice(listing.price);
    const priceLabel = listing.listing_type === "rent" ? `${priceStr}/month` : priceStr;
    const location = [listing.suburb, listing.city].filter(Boolean).join(", ");
    
    const features = [];
    if (listing.bedrooms) features.push(`🛏️ ${listing.bedrooms} Beds`);
    if (listing.bathrooms) features.push(`🚿 ${listing.bathrooms} Baths`);
    if (listing.floor_size) features.push(`📐 ${listing.floor_size}m²`);
    if (listing.has_pool) features.push("🏊 Pool");
    if (listing.has_garden) features.push("🌳 Garden");
    if (listing.has_security) features.push("🔒 Security");

    const url = `https://nextnextpropconnect.co.za/properties/${listing.id}`;

    if (platform === "facebook") {
      return `${emoji} ${action} | ${listing.title}

💰 ${priceLabel}
📍 ${location}

${features.join(" • ")}

${listing.title.includes("!") ? "" : "Don't miss this one!"}

📱 Contact ${agentName}${agencyName ? ` @ ${agencyName}` : ""}
📞 ${agentPhone}

🔗 View full listing: ${url}

#PropertyForSale #RealEstate #${listing.city?.replace(/\s/g, "")} #${listing.suburb?.replace(/\s/g, "")} #SouthAfrica #NextPropConnect`;
    }

    if (platform === "instagram") {
      return `${emoji} ${action}

${listing.title}
💰 ${priceLabel}
📍 ${location}

${features.join("\n")}

DM for viewing or contact:
📱 ${agentPhone}

Link in bio! 👆

.
.
.
#property #realestate #forsale #home #house #${listing.property_type} #${listing.city?.replace(/\s/g, "").toLowerCase()} #${listing.suburb?.replace(/\s/g, "").toLowerCase()} #southafrica #property24 #privateproperty #nextpropconnect #realtor #estateagent #homesforsale #dreamhome #investment #propertyinvestment`;
    }

    // WhatsApp
    return `${emoji} *${action}*

*${listing.title}*
💰 ${priceLabel}
📍 ${location}

${features.join(" | ")}

Contact me for viewing:
${agentName}${agencyName ? ` - ${agencyName}` : ""}
📞 ${agentPhone}

View online: ${url}`;
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Listing Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark mb-4">Select a Listing</h2>
        
        {listings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🏠</div>
            <p>No active listings</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                      🏠
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark text-sm truncate">{listing.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(listing.price)}
                    {listing.listing_type === "rent" ? "/mo" : ""} • {listing.suburb}
                  </p>
                </div>
                {selectedListing?.id === listing.id && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post Generator */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark mb-4">Generated Post</h2>

        {!selectedListing ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">👈</div>
            <p>Select a listing to generate a post</p>
          </div>
        ) : (
          <>
            {/* Platform Selector */}
            <div className="flex gap-2 mb-4">
              {[
                { key: "facebook", label: "Facebook", icon: "📘" },
                { key: "instagram", label: "Instagram", icon: "📸" },
                { key: "whatsapp", label: "WhatsApp", icon: "💬" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key as typeof platform)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                    platform === p.key
                      ? "bg-dark text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Generated Text */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {generatePost(selectedListing, platform)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generatePost(selectedListing, platform))}
                className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {copied ? "✓ Copied!" : "📋 Copy Text"}
              </button>
              
              {platform === "whatsapp" && (
                <button
                  onClick={() => shareViaWhatsApp(generatePost(selectedListing, platform))}
                  className="py-3 px-6 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition"
                >
                  Share
                </button>
              )}
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <strong>💡 Tip:</strong>{" "}
              {platform === "facebook" && "Add your own photos when posting for better engagement!"}
              {platform === "instagram" && "Use high-quality photos and post during peak hours (6-9pm)."}
              {platform === "whatsapp" && "Send to your broadcast lists for maximum reach."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
