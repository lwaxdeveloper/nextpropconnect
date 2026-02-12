"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface AISearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function AISearchBar({
  className = "",
  placeholder = "Try: 3 bed house in Sandton under 3M with pool",
}: AISearchBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    
    // Encode the query and redirect to search results page
    const encodedQuery = encodeURIComponent(query.trim());
    router.push(`/properties?ai=${encodedQuery}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center gap-2 text-primary">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-4 rounded-2xl border-2 border-gray-200 
                   focus:border-primary focus:ring-2 focus:ring-primary/20 
                   text-lg placeholder:text-gray-400 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 px-4 py-2 bg-primary text-white rounded-xl
                   font-semibold flex items-center gap-2 hover:bg-primary/90
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500 text-center">
        <SparklesIcon className="h-4 w-4 inline mr-1" />
        AI-powered search understands natural language
      </p>
    </form>
  );
}
