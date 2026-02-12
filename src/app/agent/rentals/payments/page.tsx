'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Payment {
  id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  property_title: string;
  property_address: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  status: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchPayments();
  }, [filter, month]);

  async function fetchPayments() {
    try {
      let url = `/api/rent-payments?month=${month}`;
      if (filter !== 'all') url += `&status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(paymentId: number) {
    const today = new Date().toISOString().split('T')[0];
    await fetch(`/api/rent-payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paid_date: today }),
    });
    fetchPayments();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate totals
  const totals = payments.reduce((acc, p) => {
    acc.expected += Number(p.amount);
    if (p.status === 'paid') acc.collected += Number(p.paid_amount || p.amount);
    if (p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < new Date())) {
      acc.overdue += Number(p.amount);
    }
    return acc;
  }, { expected: 0, collected: 0, overdue: 0 });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rent Payments</h1>
          <p className="text-muted-foreground">Track and manage rent collection</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-background"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Expected</div>
          <div className="text-2xl font-bold">{formatCurrency(totals.expected)}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Collected</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.collected)}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className={`text-2xl font-bold ${totals.overdue > 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(totals.overdue)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'paid', 'overdue'].map(status => (
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

      {/* Payments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <p className="text-muted-foreground">No payments found for this period</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Tenant</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Property</th>
                <th className="text-left p-4 font-medium">Due Date</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
                return (
                  <tr key={payment.id} className="border-t hover:bg-muted/30">
                    <td className="p-4">
                      <Link href={`/agent/rentals/tenants/${payment.tenant_id}`} className="hover:text-primary">
                        <div className="font-medium">{payment.tenant_name}</div>
                        <div className="text-sm text-muted-foreground">{payment.tenant_email}</div>
                      </Link>
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">
                      {payment.property_title}
                    </td>
                    <td className="p-4">
                      <div className={isOverdue ? 'text-red-600' : ''}>
                        {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                      {payment.paid_date && (
                        <div className="text-sm text-muted-foreground">
                          Paid: {new Date(payment.paid_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isOverdue ? 'overdue' : payment.status)}`}>
                        {isOverdue ? 'Overdue' : payment.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {payment.status !== 'paid' && (
                        <button
                          onClick={() => markAsPaid(payment.id)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
