"use client";

import { useState } from "react";

interface Alert {
  id: number;
  listing_type: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null;
  province: string | null;
  city: string | null;
  suburb: string | null;
  is_active: boolean;
  created_at: string;
}

interface AlertCardProps {
  alert: Alert;
  onDelete: (id: number) => void;
  onToggle: (id: number, isActive: boolean) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AlertCard({ alert, onDelete, onToggle }: AlertCardProps) {
  const [loading, setLoading] = useState(false);

  const tags: string[] = [];
  if (alert.listing_type) tags.push(alert.listing_type === "sale" ? "For Sale" : "To Rent");
  if (alert.property_type) tags.push(alert.property_type);
  if (alert.bedrooms) tags.push(`${alert.bedrooms}+ bed`);
  if (alert.province) tags.push(alert.province);
  if (alert.city) tags.push(alert.city);
  if (alert.suburb) tags.push(alert.suburb);

  const priceRange = [];
  if (alert.min_price) priceRange.push(`from ${formatPrice(Number(alert.min_price))}`);
  if (alert.max_price) priceRange.push(`up to ${formatPrice(Number(alert.max_price))}`);

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(alert.id, !alert.is_active);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(alert.id);
  };

  return (
    <div className={`bg-white border rounded-2xl p-4 transition ${alert.is_active ? "border-gray-100" : "border-gray-200 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔔</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alert.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {alert.is_active ? "Active" : "Paused"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                {tag}
              </span>
            ))}
          </div>
          {priceRange.length > 0 && (
            <p className="text-sm text-gray-600">{priceRange.join(" ")}</p>
          )}
          {tags.length === 0 && priceRange.length === 0 && (
            <p className="text-sm text-gray-400 italic">All properties</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-primary transition disabled:opacity-50"
            title={alert.is_active ? "Pause alert" : "Activate alert"}
          >
            {alert.is_active ? "⏸️" : "▶️"}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50"
            title="Delete alert"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
