'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Utility {
  id: number;
  property_id: number;
  property_title: string;
  month: string;
  utility_type: string;
  total_amount: number;
  split_method: string;
  split_count: number;
  paid_amount: number;
  created_at: string;
}

interface Property {
  id: number;
  title: string;
}

export default function UtilitiesPage() {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUtility, setNewUtility] = useState({
    propertyId: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    utilityType: 'electricity',
    totalAmount: '',
    splitMethod: 'equal',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [utilitiesRes, propertiesRes] = await Promise.all([
        fetch('/api/utilities'),
        fetch('/api/properties?mine=true'),
      ]);

      if (utilitiesRes.ok) {
        setUtilities(await utilitiesRes.json());
      }
      if (propertiesRes.ok) {
        const data = await propertiesRes.json();
        setProperties(data.properties || []);
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
      const res = await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUtility,
          propertyId: parseInt(newUtility.propertyId),
          totalAmount: parseFloat(newUtility.totalAmount),
          month: newUtility.month + '-01', // Convert to date
        }),
      });

      if (res.ok) {
        setShowNewForm(false);
        setNewUtility({
          propertyId: '',
          month: new Date().toISOString().slice(0, 7),
          utilityType: 'electricity',
          totalAmount: '',
          splitMethod: 'equal',
          notes: '',
        });
        fetchData();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity': return '⚡';
      case 'water': return '💧';
      case 'wifi': return '📶';
      case 'rates': return '🏛️';
      case 'gas': return '🔥';
      default: return '📄';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Shared Utilities</h1>
          <p className="text-muted-foreground">Split utility bills among tenants</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          + Add Utility Bill
        </button>
      </div>

      {/* New Utility Form */}
      {showNewForm && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Add Utility Bill</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Property *</label>
              <select
                value={newUtility.propertyId}
                onChange={(e) => setNewUtility(prev => ({ ...prev, propertyId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Select property...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month *</label>
              <input
                type="month"
                value={newUtility.month}
                onChange={(e) => setNewUtility(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Utility Type *</label>
              <select
                value={newUtility.utilityType}
                onChange={(e) => setNewUtility(prev => ({ ...prev, utilityType: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="electricity">⚡ Electricity</option>
                <option value="water">💧 Water</option>
                <option value="wifi">📶 WiFi/Internet</option>
                <option value="rates">🏛️ Municipal Rates</option>
                <option value="gas">🔥 Gas</option>
                <option value="other">📄 Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount (R) *</label>
              <input
                type="number"
                step="0.01"
                value={newUtility.totalAmount}
                onChange={(e) => setNewUtility(prev => ({ ...prev, totalAmount: e.target.value }))}
                placeholder="1250.00"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Split Method</label>
              <select
                value={newUtility.splitMethod}
                onChange={(e) => setNewUtility(prev => ({ ...prev, splitMethod: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="equal">Equal Split</option>
                <option value="by_occupants">By Occupants</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={newUtility.notes}
                onChange={(e) => setNewUtility(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
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
                {submitting ? 'Adding...' : 'Add & Split'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Utilities List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : utilities.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="font-semibold mb-2">No utility bills yet</h3>
          <p className="text-muted-foreground mb-4">
            Add utility bills to split them among your tenants
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Add First Utility Bill
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {utilities.map(utility => (
            <div key={utility.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getUtilityIcon(utility.utility_type)}</div>
                  <div>
                    <div className="font-semibold capitalize">{utility.utility_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {utility.property_title} • {new Date(utility.month).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(Number(utility.total_amount))}</div>
                  <div className="text-sm text-muted-foreground">
                    Split {utility.split_count} ways ({utility.split_method})
                  </div>
                  {utility.paid_amount > 0 && (
                    <div className="text-sm text-green-600">
                      {formatCurrency(Number(utility.paid_amount))} paid
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
