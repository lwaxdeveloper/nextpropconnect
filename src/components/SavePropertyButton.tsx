"use client";

import { useState } from "react";

interface Props {
  propertyId: number;
  initialSaved?: boolean;
  className?: string;
}

export default function SavePropertyButton({ propertyId, initialSaved = false, className = "" }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/save`, {
        method: saved ? "DELETE" : "POST",
      });

      if (res.ok) {
        setSaved(!saved);
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
        saved 
          ? "bg-red-500 text-white hover:bg-red-600" 
          : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={saved ? "Remove from saved" : "Save property"}
    >
      <svg 
        className="w-5 h-5" 
        fill={saved ? "currentColor" : "none"} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
    </button>
  );
}
