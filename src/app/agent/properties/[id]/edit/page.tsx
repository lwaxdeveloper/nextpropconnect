'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ListingForm from '@/components/ListingForm';

interface Property {
  id: number;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  street_address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  parking_spaces: number;
  floor_size: number;
  erf_size: number;
  year_built: number;
  has_pool: boolean;
  has_garden: boolean;
  has_security: boolean;
  has_pet_friendly: boolean;
  is_furnished: boolean;
  status: string;
}

interface PropertyImage {
  id: number;
  url: string;
  alt_text: string | null;
  category?: string;
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Property not found');
          } else if (res.status === 403) {
            setError('You do not have permission to edit this property');
          } else {
            setError('Failed to load property');
          }
          return;
        }
        const data = await res.json();
        setProperty(data.property);
        setImages(data.images || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-red-800 mb-2">{error}</h1>
          <Link href="/agent/properties" className="text-primary hover:underline">
            ← Back to My Listings
          </Link>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/agent/properties" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back to My Listings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Listing</h1>
        <p className="text-gray-500 text-sm">Update your property details</p>
      </div>

      <ListingForm
        propertyId={parseInt(id)}
        existingImages={images}
        initialData={{
          title: property.title || '',
          description: property.description || '',
          property_type: property.property_type || 'House',
          listing_type: property.listing_type || 'sale',
          price: String(property.price || 0),
          street_address: property.street_address || '',
          suburb: property.suburb || '',
          city: property.city || '',
          province: property.province || '',
          postal_code: property.postal_code || '',
          bedrooms: String(property.bedrooms || 0),
          bathrooms: String(property.bathrooms || 0),
          garages: String(property.garages || 0),
          parking_spaces: String(property.parking_spaces || 0),
          floor_size: String(property.floor_size || 0),
          erf_size: String(property.erf_size || 0),
          year_built: String(property.year_built || ''),
          has_pool: property.has_pool || false,
          has_garden: property.has_garden || false,
          has_security: property.has_security || false,
          has_pet_friendly: property.has_pet_friendly || false,
          is_furnished: property.is_furnished || false,
        }}
      />
    </div>
  );
}
