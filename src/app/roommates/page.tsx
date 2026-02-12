'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RoommateListing {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  user_verified: boolean;
  type: 'offering' | 'seeking';
  title: string;
  description: string;
  area: string;
  city: string;
  rent_amount: number;
  budget_min: number;
  budget_max: number;
  available_from: string;
  move_in_date: string;
  is_furnished: boolean;
  has_own_bathroom: boolean;
  smoker_friendly: boolean;
  pet_friendly: boolean;
  my_age: number;
  my_gender: string;
  images: string[];
  created_at: string;
}

export default function RoommatesPage() {
  const [listings, setListings] = useState<RoommateListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    budgetMax: '',
  });

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.city) params.set('city', filters.city);
      if (filters.budgetMax) params.set('budgetMax', filters.budgetMax);

      const res = await fetch(`/api/roommates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const offeringListings = listings.filter(l => l.type === 'offering');
  const seekingListings = listings.filter(l => l.type === 'seeking');

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Roommate</h1>
          <p className="text-lg opacity-90 mb-6">
            Looking for a room or have one to offer? Connect with compatible flatmates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/roommates/new?type=offering"
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100"
            >
              🏠 I Have a Room
            </Link>
            <Link
              href="/roommates/new?type=seeking"
              className="px-6 py-3 bg-purple-800 text-white rounded-lg font-medium hover:bg-purple-900"
            >
              🔍 I Need a Room
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Listings</option>
              <option value="offering">🏠 Rooms Available</option>
              <option value="seeking">🔍 People Looking</option>
            </select>
            <input
              type="text"
              placeholder="City..."
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Max budget (R)"
              value={filters.budgetMax}
              onChange={(e) => setFilters(prev => ({ ...prev, budgetMax: e.target.value }))}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={fetchListings}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Search
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-700">{offeringListings.length}</div>
            <div className="text-sm text-green-600">Rooms Available</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-700">{seekingListings.length}</div>
            <div className="text-sm text-blue-600">People Looking</div>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-xl">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to post!</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/roommates/new?type=offering"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Post a Room
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <Link
                key={listing.id}
                href={`/roommates/${listing.id}`}
                className="bg-card border rounded-xl overflow-hidden hover:border-primary transition"
              >
                {/* Type Badge */}
                <div className={`px-4 py-2 text-sm font-medium ${
                  listing.type === 'offering' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {listing.type === 'offering' ? '🏠 Room Available' : '🔍 Looking for Room'}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{listing.title}</h3>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    📍 {listing.area || listing.city}
                  </div>

                  {/* Price */}
                  <div className="text-lg font-bold mb-3">
                    {listing.type === 'offering' ? (
                      <>{formatCurrency(Number(listing.rent_amount))}<span className="text-sm text-muted-foreground">/mo</span></>
                    ) : (
                      <>Budget: {formatCurrency(Number(listing.budget_min))} - {formatCurrency(Number(listing.budget_max))}</>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {listing.is_furnished && <span className="px-2 py-1 bg-muted rounded">Furnished</span>}
                    {listing.has_own_bathroom && <span className="px-2 py-1 bg-muted rounded">Own Bath</span>}
                    {listing.smoker_friendly && <span className="px-2 py-1 bg-muted rounded">Smoker OK</span>}
                    {listing.pet_friendly && <span className="px-2 py-1 bg-muted rounded">Pets OK</span>}
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      {listing.user_avatar ? (
                        <img src={listing.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-1">
                        {listing.user_name}
                        {listing.user_verified && <span className="text-blue-500">✓</span>}
                      </div>
                      {listing.my_age && listing.my_gender && (
                        <div className="text-xs text-muted-foreground">
                          {listing.my_age}yo {listing.my_gender}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
