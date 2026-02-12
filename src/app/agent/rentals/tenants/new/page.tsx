'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Property {
  id: number;
  title: string;
  address: string;
  status: string;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    property_id: '',
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    lease_start: '',
    lease_end: '',
    rent_amount: '',
    rent_due_day: '1',
    deposit_amount: '',
    deposit_paid: false,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      // Fetch rental properties owned by user
      const res = await fetch('/api/properties?status=rent');
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          property_id: parseInt(formData.property_id),
          rent_amount: parseFloat(formData.rent_amount),
          rent_due_day: parseInt(formData.rent_due_day),
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tenant');
      }

      router.push('/agent/rentals/tenants');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add New Tenant</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Property *</label>
          <select
            name="property_id"
            value={formData.property_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.title} - {property.address}
              </option>
            ))}
          </select>
          {properties.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              No rental properties found. List a property for rent first.
            </p>
          )}
        </div>

        {/* Tenant Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tenant Name *</label>
            <input
              type="text"
              name="tenant_name"
              value={formData.tenant_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              name="tenant_email"
              value={formData.tenant_email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="tenant@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="tenant_phone"
              value={formData.tenant_phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="082 123 4567"
            />
          </div>
        </div>

        {/* Lease Details */}
        <div className="border-t pt-6">
          <h2 className="font-semibold mb-4">Lease Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lease Start Date *</label>
              <input
                type="date"
                name="lease_start"
                value={formData.lease_start}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lease End Date</label>
              <input
                type="date"
                name="lease_end"
                value={formData.lease_end}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Rent (ZAR) *</label>
              <input
                type="number"
                name="rent_amount"
                value={formData.rent_amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="8500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rent Due Day *</label>
              <select
                name="rent_due_day"
                value={formData.rent_due_day}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {[1, 7, 15, 25, 28].map(day => (
                  <option key={day} value={day}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Deposit */}
        <div className="border-t pt-6">
          <h2 className="font-semibold mb-4">Deposit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deposit Amount (ZAR)</label>
              <input
                type="number"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Usually 1-2 months rent"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="deposit_paid"
                  checked={formData.deposit_paid}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Deposit has been paid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.property_id}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {submitting ? 'Adding...' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}
