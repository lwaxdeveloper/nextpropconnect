'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TenantDashboard {
  tenant: {
    id: number;
    property_title: string;
    property_address: string;
    rent_amount: number;
    rent_due_day: number;
    lease_start: string;
    lease_end: string | null;
    landlord_name: string;
    landlord_email: string;
  };
  nextPayment: {
    amount: number;
    due_date: string;
    status: string;
  } | null;
  recentPayments: {
    id: number;
    amount: number;
    due_date: string;
    paid_date: string | null;
    status: string;
  }[];
  maintenanceRequests: {
    id: number;
    title: string;
    status: string;
    created_at: string;
  }[];
}

export default function TenantDashboard() {
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/tenant/dashboard');
      if (!res.ok) {
        if (res.status === 404) {
          setError('No active tenancy found for your account');
        } else {
          setError('Failed to load dashboard');
        }
        return;
      }
      const data = await res.json();
      setData(data);
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-xl font-semibold mb-2">Tenant Portal</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/" className="text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tenant, nextPayment, recentPayments, maintenanceRequests } = data;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Tenant Portal</h1>
            <p className="text-sm text-muted-foreground">{tenant.property_title}</p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Next Payment Card */}
        {nextPayment && (
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold mb-1">Next Rent Payment</h2>
                <div className="text-3xl font-bold text-primary">{formatCurrency(nextPayment.amount)}</div>
                <div className="text-sm text-muted-foreground">
                  Due: {new Date(nextPayment.due_date).toLocaleDateString()}
                </div>
              </div>
              <Link
                href="/tenant/pay"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 text-center"
              >
                Pay Now
              </Link>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/tenant/lease" className="bg-white rounded-xl p-4 border hover:border-primary transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                📄
              </div>
              <div>
                <div className="font-medium">Lease Details</div>
                <div className="text-sm text-muted-foreground">View your lease</div>
              </div>
            </div>
          </Link>

          <Link href="/tenant/payments" className="bg-white rounded-xl p-4 border hover:border-primary transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                💳
              </div>
              <div>
                <div className="font-medium">Payment History</div>
                <div className="text-sm text-muted-foreground">View past payments</div>
              </div>
            </div>
          </Link>

          <Link href="/tenant/maintenance" className="bg-white rounded-xl p-4 border hover:border-primary transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                🔧
              </div>
              <div>
                <div className="font-medium">Maintenance</div>
                <div className="text-sm text-muted-foreground">Request repairs</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Lease Summary */}
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="font-semibold mb-4">Lease Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Monthly Rent</div>
              <div className="font-semibold">{formatCurrency(tenant.rent_amount)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Day</div>
              <div className="font-semibold">{tenant.rent_due_day}th of month</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lease Start</div>
              <div className="font-semibold">{new Date(tenant.lease_start).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lease End</div>
              <div className="font-semibold">
                {tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'Month-to-month'}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-semibold mb-3">Recent Payments</h3>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.slice(0, 5).map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <div>
                      <div className="text-sm font-medium">{formatCurrency(payment.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Maintenance Requests</h3>
              <Link href="/tenant/maintenance/new" className="text-sm text-primary hover:underline">
                + New request
              </Link>
            </div>
            {maintenanceRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests</p>
            ) : (
              <div className="space-y-2">
                {maintenanceRequests.slice(0, 5).map(request => (
                  <div key={request.id} className="p-2 bg-muted/50 rounded">
                    <div className="text-sm font-medium">{request.title}</div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>{request.status}</span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Landlord Contact */}
        <div className="bg-white rounded-xl p-4 border">
          <h3 className="font-semibold mb-2">Your Landlord</h3>
          <div className="text-sm">
            <div>{tenant.landlord_name}</div>
            <a href={`mailto:${tenant.landlord_email}`} className="text-primary hover:underline">
              {tenant.landlord_email}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
