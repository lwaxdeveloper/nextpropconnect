"use client";

import { useState } from "react";
import { SparklesIcon, ChartBarIcon } from "@heroicons/react/24/outline";

interface ValuationResult {
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  comparablesUsed: number;
}

interface PropertyValuationProps {
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  suburb?: string;
  city?: string;
  className?: string;
}

export default function PropertyValuation({
  bedrooms: initialBedrooms,
  bathrooms: initialBathrooms,
  propertyType: initialType,
  suburb: initialSuburb,
  city: initialCity,
  className = "",
}: PropertyValuationProps) {
  const [bedrooms, setBedrooms] = useState(initialBedrooms || 3);
  const [bathrooms, setBathrooms] = useState(initialBathrooms || 2);
  const [propertyType, setPropertyType] = useState(initialType || "house");
  const [suburb, setSuburb] = useState(initialSuburb || "");
  const [city, setCity] = useState(initialCity || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-red-600 bg-red-50";
    }
  };

  const handleValuation = async () => {
    if (!suburb || !city) {
      setError("Please enter suburb and city");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedrooms,
          bathrooms,
          propertyType,
          suburb,
          city,
        }),
      });

      if (!response.ok) {
        throw new Error("Valuation failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Valuation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 p-6 bg-white rounded-2xl shadow-lg border ${className}`}>
      <div className="flex items-center gap-2 text-primary font-bold text-lg">
        <ChartBarIcon className="h-6 w-6" />
        Property Valuation Tool
        <SparklesIcon className="h-5 w-5 text-purple-500" />
      </div>

      <p className="text-sm text-gray-600">
        Get an AI-powered estimate of your property&apos;s market value based on similar listings.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "bedroom" : "bedrooms"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <select
            value={bathrooms}
            onChange={(e) => setBathrooms(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "bathroom" : "bathrooms"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary"
          >
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="townhouse">Townhouse</option>
            <option value="land">Land</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Johannesburg"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
          <input
            type="text"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            placeholder="e.g., Sandton, Bryanston"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleValuation}
        disabled={loading}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold
                 flex items-center justify-center gap-2 hover:bg-primary/90
                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Estimating Value...
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5" />
            Get Valuation
          </>
        )}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-xl">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">Estimated Value</p>
            <p className="text-3xl font-black text-primary">
              {formatPrice(result.estimatedValue)}
            </p>
            <p className="text-sm text-gray-500">
              Range: {formatPrice(result.lowRange)} - {formatPrice(result.highRange)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(
                result.confidence
              )}`}
            >
              {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} Confidence
            </span>
            <span className="text-sm text-gray-500">
              ({result.comparablesUsed} comparables)
            </span>
          </div>

          <p className="text-sm text-gray-700 text-center">{result.reasoning}</p>

          <p className="mt-3 text-xs text-gray-500 text-center">
            * This is an AI estimate for guidance only. Consult a professional valuer for accurate valuations.
          </p>
        </div>
      )}
    </div>
  );
}
