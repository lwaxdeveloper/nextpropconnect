"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface PropertyMapProps {
  address: string;
  suburb: string;
  city: string;
  province: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function PropertyMap({
  address,
  suburb,
  city,
  province,
  latitude,
  longitude,
}: PropertyMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [loading, setLoading] = useState(!position);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fix default marker icon
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    });

    // Geocode address if no coordinates
    if (!position) {
      const searchQuery = `${suburb}, ${city}, ${province}, South Africa`;
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          } else {
            setError(true);
          }
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [position, suburb, city, province]);

  if (loading) {
    return (
      <div className="bg-muted rounded-2xl h-48 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !position) {
    return (
      <div className="bg-muted rounded-2xl h-48 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-3xl mb-2">📍</div>
          <p className="text-sm font-medium">{suburb}, {city}</p>
          <p className="text-xs mt-1">{province}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden h-48">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <MapContainer
        center={position}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <strong>{suburb}</strong>
              <br />
              {city}, {province}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
