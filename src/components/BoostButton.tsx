"use client";

import { useState } from "react";
import { Zap, X, Check } from "lucide-react";
import { BOOST_TYPES } from "@/lib/ozow";

interface BoostButtonProps {
  propertyId: number;
  currentBoost?: string | null;
}

type BoostKey = keyof typeof BOOST_TYPES;

function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA")}`;
}

export default function BoostButton({ propertyId, currentBoost }: BoostButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<BoostKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBoost = async () => {
    if (!selectedBoost) return;
    
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
        throw new Error(data.error || "Failed to process boost");
      }

      const data = await res.json();
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.demo) {
        // Demo mode - show success and reload
        alert("Demo mode: Boost activated!");
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to boost");
      setLoading(false);
    }
  };

  if (currentBoost) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm">
        <Zap className="w-4 h-4" />
        <span className="font-medium">Boosted: {currentBoost}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-orange-600 transition shadow-lg"
      >
        <Zap className="w-4 h-4" />
        Boost Listing
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark">Boost Your Listing</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Get more views and inquiries by boosting your listing to the top.
              </p>

              {Object.entries(BOOST_TYPES).map(([key, boost]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBoost(key as BoostKey)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition ${
                    selectedBoost === key
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-dark">{boost.name}</span>
                    <span className="font-bold text-primary">{formatPrice(boost.price)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{boost.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{boost.days} days</p>
                  {selectedBoost === key && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </button>
              ))}

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleBoost}
                disabled={!selectedBoost || loading}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold hover:from-amber-500 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : selectedBoost ? `Pay ${formatPrice(BOOST_TYPES[selectedBoost].price)}` : "Select a boost"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
