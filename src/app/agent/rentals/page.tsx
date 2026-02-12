'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tenant {
  id: number;
  tenant_name: string;
  tenant_email: string;
  property_title: string;
  property_address: string;
  rent_amount: number;
  lease_end: string | null;
  status: string;
}

interface RentPayment {
  id: number;
  tenant_name: string;
  property_title: string;
  amount: number;
  due_date: string;
  status: string;
}

interface Stats {
  totalProperties: number;
  activeTenants: number;
  expectedRent: number;
  collectedRent: number;
  overdueCount: number;
}

export default function RentalsPage() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    activeTenants: 0,
    expectedRent: 0,
    collectedRent: 0,
    overdueCount: 0,
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [recentPayments, setRecentPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [tenantsRes, paymentsRes] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/rent-payments?status=pending'),
      ]);

      const tenantsData = await tenantsRes.json();
      const paymentsData = await paymentsRes.json();

      setTenants(tenantsData);
      setRecentPayments(paymentsData.slice(0, 5));

      // Calculate stats
      const activeTenants = tenantsData.filter((t: Tenant) => t.status === 'active');
      const expectedRent = activeTenants.reduce((sum: number, t: Tenant) => sum + Number(t.rent_amount), 0);
      const overduePayments = paymentsData.filter((p: RentPayment) => 
        p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < new Date())
      );

      setStats({
        totalProperties: new Set(tenantsData.map((t: Tenant) => t.property_title)).size,
        activeTenants: activeTenants.length,
        expectedRent,
        collectedRent: 0, // Would need paid payments
        overdueCount: overduePayments.length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rental Management</h1>
          <p className="text-muted-foreground">Manage tenants, rent & maintenance</p>
        </div>
        <Link
          href="/agent/rentals/tenants/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          + Add Tenant
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-muted-foreground text-sm">Managed Properties</div>
          <div className="text-2xl font-bold">{stats.totalProperties}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-muted-foreground text-sm">Active Tenants</div>
          <div className="text-2xl font-bold">{stats.activeTenants}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-muted-foreground text-sm">Expected Rent (Monthly)</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.expectedRent)}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-muted-foreground text-sm">Overdue Payments</div>
          <div className={`text-2xl font-bold ${stats.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.overdueCount}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link href="/agent/rentals/tenants" className="bg-card border rounded-xl p-4 hover:border-primary transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Tenants</div>
              <div className="text-sm text-muted-foreground">Manage tenant records</div>
            </div>
          </div>
        </Link>

        <Link href="/agent/rentals/payments" className="bg-card border rounded-xl p-4 hover:border-primary transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Rent Payments</div>
              <div className="text-sm text-muted-foreground">Track & record payments</div>
            </div>
          </div>
        </Link>

        <Link href="/agent/rentals/maintenance" className="bg-card border rounded-xl p-4 hover:border-primary transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Maintenance</div>
              <div className="text-sm text-muted-foreground">Handle repair requests</div>
            </div>
          </div>
        </Link>

        <Link href="/agent/rentals/screening" className="bg-card border rounded-xl p-4 hover:border-primary transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Tenant Screening</div>
              <div className="text-sm text-muted-foreground">Verify potential tenants</div>
            </div>
          </div>
        </Link>

        <Link href="/agent/rentals/utilities" className="bg-card border rounded-xl p-4 hover:border-primary transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <div className="font-semibold">Utilities</div>
              <div className="text-sm text-muted-foreground">Split utility bills</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Tenants & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenants List */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Recent Tenants</h2>
            <Link href="/agent/rentals/tenants" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          {tenants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tenants yet</p>
          ) : (
            <div className="space-y-3">
              {tenants.slice(0, 5).map(tenant => (
                <Link
                  key={tenant.id}
                  href={`/agent/rentals/tenants/${tenant.id}`}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-muted transition"
                >
                  <div>
                    <div className="font-medium">{tenant.tenant_name}</div>
                    <div className="text-sm text-muted-foreground">{tenant.property_title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(Number(tenant.rent_amount))}/mo</div>
                    <div className={`text-xs ${tenant.status === 'active' ? 'text-green-600' : 'text-orange-600'}`}>
                      {tenant.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Payments */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Pending Payments</h2>
            <Link href="/agent/rentals/payments" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending payments</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(payment => {
                const isOverdue = new Date(payment.due_date) < new Date();
                return (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{payment.tenant_name}</div>
                      <div className="text-sm text-muted-foreground">{payment.property_title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(Number(payment.amount))}</div>
                      <div className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                        Due: {new Date(payment.due_date).toLocaleDateString()}
                        {isOverdue && ' (Overdue)'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
