"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SaveSearchButton() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  const hasFilters = searchParams.toString().length > 0 && 
    Array.from(searchParams.keys()).some(k => k !== "page" && k !== "sort");

  if (!hasFilters) return null;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_type: searchParams.get("listing_type") || null,
          property_type: searchParams.get("property_type") || null,
          min_price: searchParams.get("min_price") || null,
          max_price: searchParams.get("max_price") || null,
          bedrooms: searchParams.get("bedrooms") || null,
          province: searchParams.get("province") || null,
          city: searchParams.get("city") || null,
          suburb: searchParams.get("suburb") || null,
        }),
      });

      if (res.status === 401) {
        setError("Sign in to save searches");
        return;
      }
      if (!res.ok) throw new Error("Failed to save");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Could not save search. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
          saved
            ? "bg-green-100 text-green-700"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        } disabled:cursor-not-allowed`}
      >
        {saved ? "✓ Saved!" : saving ? "Saving…" : "🔔 Save this search"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
