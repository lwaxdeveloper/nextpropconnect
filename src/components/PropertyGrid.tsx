"use client";

import PropertyCard, { type PropertyCardData } from "./PropertyCard";

export default function PropertyGrid({
  properties,
}: {
  properties: PropertyCardData[];
}) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏚️</div>
        <h3 className="text-xl font-bold text-dark mb-2">No properties found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try adjusting your filters or search terms. Maybe broaden the area or
          change the price range — the perfect place is out there.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
