'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tenant {
  id: number;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_id: number;
  property_title: string;
  property_address: string;
  rent_amount: number;
  rent_due_day: number;
  lease_start: string;
  lease_end: string | null;
  deposit_amount: number;
  deposit_paid: boolean;
  status: string;
  created_at: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  async function fetchTenants() {
    try {
      const url = filter === 'all' ? '/api/tenants' : `/api/tenants?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'notice': return 'bg-orange-100 text-orange-800';
      case 'vacated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage all your tenants</p>
        </div>
        <Link
          href="/agent/rentals/tenants/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          + Add Tenant
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'notice', 'vacated'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Tenants List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <svg className="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="font-semibold mb-2">No tenants found</h3>
          <p className="text-muted-foreground mb-4">Add your first tenant to start managing rentals</p>
          <Link
            href="/agent/rentals/tenants/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            + Add Tenant
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map(tenant => (
            <Link
              key={tenant.id}
              href={`/agent/rentals/tenants/${tenant.id}`}
              className="block bg-card border rounded-xl p-4 hover:border-primary transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{tenant.tenant_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {tenant.property_title}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {tenant.tenant_email}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-end gap-2 md:gap-1 text-right">
                  <div className="text-lg font-bold text-primary">{formatCurrency(Number(tenant.rent_amount))}/mo</div>
                  <div className="text-sm text-muted-foreground">Due: {tenant.rent_due_day}th</div>
                  {tenant.lease_end && (
                    <div className="text-xs text-muted-foreground">
                      Lease ends: {new Date(tenant.lease_end).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
