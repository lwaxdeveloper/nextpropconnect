'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Property {
  id: number;
  title: string;
  price: number;
  listing_type: 'sale' | 'rent';
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  address: string;
  city: string;
  province: string;
  status: string;
  is_featured: boolean;
  views_count: number;
  inquiries_count: number;
  created_at: string;
  primary_image?: string;
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'rented' | 'draft'>('all');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const res = await fetch('/api/agent/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProperties(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete listing');
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProperties(prev => prev.map(p => 
          p.id === id ? { ...p, status: newStatus } : p
        ));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const filteredProperties = properties.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return p.status === 'active';
    if (filter === 'sold') return p.status === 'sold';
    if (filter === 'rented') return p.status === 'rented';
    if (filter === 'draft') return p.status === 'draft';
    return true;
  });

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    sold: properties.filter(p => p.status === 'sold').length,
    rented: properties.filter(p => p.status === 'rented').length,
    draft: properties.filter(p => p.status === 'draft').length,
  };

  function formatPrice(price: number, type: string) {
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
    return type === 'rent' ? `${formatted}/mo` : formatted;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 text-sm">Manage your property listings</p>
        </div>
        <Link
          href="/properties/new"
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition flex items-center gap-2"
        >
          <span className="text-lg">+</span> New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 transition text-left ${
            filter === 'all' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-4 rounded-xl border-2 transition text-left ${
            filter === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </button>
        <button
          onClick={() => setFilter('sold')}
          className={`p-4 rounded-xl border-2 transition text-left ${
            filter === 'sold' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
          <div className="text-sm text-gray-500">Sold</div>
        </button>
        <button
          onClick={() => setFilter('rented')}
          className={`p-4 rounded-xl border-2 transition text-left ${
            filter === 'rented' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-purple-600">{stats.rented}</div>
          <div className="text-sm text-gray-500">Rented</div>
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`p-4 rounded-xl border-2 transition text-left ${
            filter === 'draft' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
          <div className="text-sm text-gray-500">Drafts</div>
        </button>
      </div>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? 'Create your first property listing to start attracting buyers and tenants.'
              : 'Try selecting a different filter to see more listings.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
            >
              + Create First Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map(property => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border-2 border-gray-200 p-4 hover:border-gray-300 transition shadow-sm"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-32 h-24 md:w-48 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {property.primary_image ? (
                    <Image
                      src={property.primary_image}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                  )}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold ${
                    property.listing_type === 'rent' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-500">{property.address}, {property.city}</p>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatPrice(property.price, property.listing_type)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      property.status === 'active' ? 'bg-green-100 text-green-700' :
                      property.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      property.status === 'rented' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{property.bedrooms} bed</span>
                    <span>{property.bathrooms} bath</span>
                    <span>{property.size_sqm}m²</span>
                    <span className="capitalize">{property.property_type}</span>
                  </div>

                  <div className="flex items-center gap-6 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <span>👁</span> {property.views_count || 0} views
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <span>💬</span> {property.inquiries_count || 0} inquiries
                    </span>
                    {property.is_featured && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <span>⭐</span> Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/properties/${property.id}`}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
                  >
                    View
                  </Link>
                  <Link
                    href={`/agent/properties/${property.id}/edit`}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark text-center"
                  >
                    Edit
                  </Link>
                  <div className="relative group">
                    <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 w-full">
                      Status ▾
                    </button>
                    <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => handleStatusChange(property.id, 'active')}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Active
                      </button>
                      <button
                        onClick={() => handleStatusChange(property.id, property.listing_type === 'rent' ? 'rented' : 'sold')}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {property.listing_type === 'rent' ? 'Rented' : 'Sold'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(property.id, 'draft')}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Draft
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(property.id)}
                    disabled={deleting === property.id}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === property.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
