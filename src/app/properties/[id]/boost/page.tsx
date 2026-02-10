"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BOOST_TYPES } from "@/lib/ozow";
import { Zap, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA")}`;
}

export default function BoostPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = parseInt(params.id as string);

  const [property, setProperty] = useState<{ id: number; title: string; image_url?: string } | null>(null);
  const [selectedBoost, setSelectedBoost] = useState<keyof typeof BOOST_TYPES>("spotlight");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then(setProperty)
      .catch(() => router.push("/properties"));
  }, [propertyId, router]);

  const handleBoost = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "boost",
          boostType: selectedBoost,
          propertyId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment failed");
      }

      const data = await res.json();
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(false);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const boost = BOOST_TYPES[selectedBoost];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-dark mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listing
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Boost Your Listing</h1>
            </div>
            <p className="opacity-90">Get more views and inquiries</p>
          </div>

          {/* Property Preview */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {property.image_url ? (
                  <img src={property.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-dark">{property.title}</h2>
                <p className="text-sm text-gray-500">Property #{property.id}</p>
              </div>
            </div>
          </div>

          {/* Boost Options */}
          <div className="p-6">
            <h3 className="font-semibold text-dark mb-4">Choose a Boost Package</h3>
            
            <div className="space-y-3">
              {Object.entries(BOOST_TYPES).map(([key, b]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBoost(key as keyof typeof BOOST_TYPES)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                    selectedBoost === key
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    key === "mega" ? "bg-purple-100 text-purple-600" :
                    key === "premium" ? "bg-blue-100 text-blue-600" :
                    "bg-yellow-100 text-yellow-600"
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-dark">{b.name}</span>
                      <span className="font-bold text-dark">{formatPrice(b.price)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{b.description}</p>
                  </div>
                  {selectedBoost === key && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Summary & Pay */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-gray-600">{boost.name}</span>
                <p className="text-xs text-gray-400">{boost.days} days</p>
              </div>
              <span className="text-2xl font-bold text-dark">{formatPrice(boost.price)}</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleBoost}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : `Boost for ${formatPrice(boost.price)}`}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Boost starts immediately after payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
