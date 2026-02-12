'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Screening {
  id: number;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_title: string;
  status: string;
  recommendation: string | null;
  screening_score: number | null;
  affordability_passed: boolean | null;
  employment_verified: boolean;
  rental_history_verified: boolean;
  created_at: string;
}

export default function TenantScreeningPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newScreening, setNewScreening] = useState({ tenantEmail: '', propertyId: '', monthlyRent: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchScreenings();
  }, []);

  async function fetchScreenings() {
    try {
      const res = await fetch('/api/tenant-screening?role=landlord');
      if (res.ok) {
        const data = await res.json();
        setScreenings(data.screenings);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/tenant-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScreening),
      });

      if (res.ok) {
        setShowNewForm(false);
        setNewScreening({ tenantEmail: '', propertyId: '', monthlyRent: '' });
        fetchScreenings();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (screening: Screening) => {
    if (screening.recommendation === 'approved') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✓ Approved</span>;
    }
    if (screening.recommendation === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">✗ Rejected</span>;
    }
    if (screening.status === 'submitted') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Ready to Review</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tenant Screening</h1>
          <p className="text-muted-foreground">Verify potential tenants before signing leases</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          + Screen New Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{screenings.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {screenings.filter(s => s.status === 'pending').length}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {screenings.filter(s => s.recommendation === 'approved').length}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Rejected</div>
          <div className="text-2xl font-bold text-red-600">
            {screenings.filter(s => s.recommendation === 'rejected').length}
          </div>
        </div>
      </div>

      {/* New Screening Form */}
      {showNewForm && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Request Tenant Screening</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tenant Email *</label>
              <input
                type="email"
                value={newScreening.tenantEmail}
                onChange={(e) => setNewScreening(prev => ({ ...prev, tenantEmail: e.target.value }))}
                placeholder="tenant@example.com"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Tenant must have a NextPropConnect account</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent (R)</label>
              <input
                type="number"
                value={newScreening.monthlyRent}
                onChange={(e) => setNewScreening(prev => ({ ...prev, monthlyRent: e.target.value }))}
                placeholder="8500"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Screenings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : screenings.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="font-semibold mb-2">No screenings yet</h3>
          <p className="text-muted-foreground mb-4">
            Request a tenant screening to verify potential renters
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Screen Your First Tenant
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {screenings.map(screening => (
            <Link
              key={screening.id}
              href={`/agent/rentals/screening/${screening.id}`}
              className="block bg-card border rounded-xl p-4 hover:border-primary transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div>
                    <div className="font-semibold">{screening.tenant_name}</div>
                    <div className="text-sm text-muted-foreground">{screening.tenant_email}</div>
                    {screening.property_title && (
                      <div className="text-sm text-muted-foreground">For: {screening.property_title}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(screening)}
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(screening.created_at).toLocaleDateString()}
                  </div>
                  {screening.screening_score && (
                    <div className="text-sm font-medium">Score: {screening.screening_score}/100</div>
                  )}
                </div>
              </div>
              
              {/* Quick indicators */}
              <div className="flex gap-4 mt-3 pt-3 border-t">
                <div className="flex items-center gap-1 text-sm">
                  {screening.employment_verified ? (
                    <span className="text-green-600">✓ Employment</span>
                  ) : (
                    <span className="text-muted-foreground">○ Employment</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {screening.rental_history_verified ? (
                    <span className="text-green-600">✓ Rental History</span>
                  ) : (
                    <span className="text-muted-foreground">○ Rental History</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {screening.affordability_passed === true ? (
                    <span className="text-green-600">✓ Affordability</span>
                  ) : screening.affordability_passed === false ? (
                    <span className="text-red-600">✗ Affordability</span>
                  ) : (
                    <span className="text-muted-foreground">○ Affordability</span>
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
