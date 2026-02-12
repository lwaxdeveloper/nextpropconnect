'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Tenant {
  id: number;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_id: number;
  property_title: string;
  property_address: string;
  property_images: string[];
  rent_amount: number;
  rent_due_day: number;
  lease_start: string;
  lease_end: string | null;
  deposit_amount: number;
  deposit_paid: boolean;
  status: string;
  payments: Payment[];
  maintenance_requests: MaintenanceRequest[];
}

interface Payment {
  id: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string;
}

interface MaintenanceRequest {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchTenant();
  }, [id]);

  async function fetchTenant() {
    try {
      const res = await fetch(`/api/tenants/${id}`);
      if (!res.ok) throw new Error('Tenant not found');
      const data = await res.json();
      setTenant(data);
    } catch (error) {
      console.error('Error:', error);
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  async function recordPayment(paymentData: { amount: number; payment_method: string; notes?: string }) {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(tenant!.rent_due_day);
    
    await fetch('/api/rent-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenant!.id,
        amount: tenant!.rent_amount,
        due_date: dueDate.toISOString().split('T')[0],
        paid_date: today,
        paid_amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        status: 'paid',
        notes: paymentData.notes,
      }),
    });
    
    setShowPaymentModal(false);
    fetchTenant();
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold">Tenant not found</h1>
        <Link href="/agent/rentals/tenants" className="text-primary hover:underline">
          Back to tenants
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Link href="/agent/rentals/tenants" className="text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to tenants
          </Link>
          <h1 className="text-2xl font-bold">{tenant.tenant_name}</h1>
          <p className="text-muted-foreground">{tenant.property_title}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Record Payment
          </button>
          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(tenant.status)}`}>
            {tenant.status}
          </span>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{tenant.tenant_email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div>{tenant.tenant_phone || 'Not provided'}</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Lease Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Monthly Rent</div>
                <div className="text-lg font-bold text-primary">{formatCurrency(Number(tenant.rent_amount))}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Due Day</div>
                <div>{tenant.rent_due_day}th of month</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lease Start</div>
                <div>{new Date(tenant.lease_start).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lease End</div>
                <div>{tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'Month-to-month'}</div>
              </div>
            </div>
            {tenant.deposit_amount && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Deposit</div>
                    <div className="font-medium">{formatCurrency(Number(tenant.deposit_amount))}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${tenant.deposit_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {tenant.deposit_paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Payment History</h2>
            {tenant.payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {tenant.payments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{formatCurrency(Number(payment.amount))}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(payment.due_date).toLocaleDateString()}
                        {payment.paid_date && ` • Paid: ${new Date(payment.paid_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Card */}
          <div className="bg-card border rounded-xl overflow-hidden">
            {tenant.property_images?.[0] && (
              <img
                src={tenant.property_images[0]}
                alt={tenant.property_title}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold">{tenant.property_title}</h3>
              <p className="text-sm text-muted-foreground">{tenant.property_address}</p>
              <Link
                href={`/properties/${tenant.property_id}`}
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View property →
              </Link>
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-semibold mb-3">Maintenance Requests</h3>
            {tenant.maintenance_requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests</p>
            ) : (
              <div className="space-y-2">
                {tenant.maintenance_requests.slice(0, 3).map(req => (
                  <div key={req.id} className="p-2 bg-muted/50 rounded">
                    <div className="text-sm font-medium">{req.title}</div>
                    <div className="text-xs text-muted-foreground">{req.status} • {req.priority}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold mb-3">Actions</h3>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              Record Payment
            </button>
            <button
              onClick={() => {/* TODO: implement */}}
              className="w-full px-4 py-2 border rounded-lg text-sm hover:bg-muted"
            >
              Send Reminder
            </button>
            <button
              onClick={() => {/* TODO: implement */}}
              className="w-full px-4 py-2 border rounded-lg text-sm hover:bg-muted text-orange-600"
            >
              Give Notice
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          tenant={tenant}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={recordPayment}
        />
      )}
    </div>
  );
}

function PaymentModal({ tenant, onClose, onSubmit }: { 
  tenant: Tenant; 
  onClose: () => void; 
  onSubmit: (data: { amount: number; payment_method: string; notes?: string }) => void;
}) {
  const [amount, setAmount] = useState(tenant.rent_amount.toString());
  const [method, setMethod] = useState('eft');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ amount: parseFloat(amount), payment_method: method, notes });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Record Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (ZAR)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="eft">EFT / Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="debit_order">Debit Order</option>
              <option value="ozow">Ozow</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Reference number, etc."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
