'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Unit {
  id: number;
  unit_name: string;
  description: string;
  rent_amount: number;
  deposit_amount: number;
  status: string;
  is_furnished: boolean;
  has_own_bathroom: boolean;
  has_own_entrance: boolean;
  max_occupants: number;
  tenant_id: number | null;
  tenant_name: string | null;
  tenant_status: string | null;
}

interface Property {
  id: number;
  title: string;
  address: string;
}

export default function PropertyUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUnit, setNewUnit] = useState({
    unitName: '',
    description: '',
    rentAmount: '',
    depositAmount: '',
    isFurnished: false,
    hasOwnBathroom: false,
    hasOwnEntrance: false,
    maxOccupants: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [unitsRes, propertyRes] = await Promise.all([
        fetch(`/api/properties/${id}/units`),
        fetch(`/api/properties/${id}`),
      ]);

      if (unitsRes.ok) {
        setUnits(await unitsRes.json());
      }
      if (propertyRes.ok) {
        setProperty(await propertyRes.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/properties/${id}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUnit,
          rentAmount: newUnit.rentAmount ? parseFloat(newUnit.rentAmount) : null,
          depositAmount: newUnit.depositAmount ? parseFloat(newUnit.depositAmount) : null,
        }),
      });

      if (res.ok) {
        setShowNewForm(false);
        setNewUnit({
          unitName: '',
          description: '',
          rentAmount: '',
          depositAmount: '',
          isFurnished: false,
          hasOwnBathroom: false,
          hasOwnEntrance: false,
          maxOccupants: 1,
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

  const occupiedUnits = units.filter(u => u.tenant_id);
  const availableUnits = units.filter(u => !u.tenant_id && u.status === 'available');
  const totalRent = units.reduce((sum, u) => sum + (Number(u.rent_amount) || 0), 0);
  const collectedRent = occupiedUnits.reduce((sum, u) => sum + (Number(u.rent_amount) || 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/agent/properties" className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block">
            ← Back to Properties
          </Link>
          <h1 className="text-2xl font-bold">{property?.title || 'Property'} - Units</h1>
          <p className="text-muted-foreground">{property?.address}</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          + Add Unit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Units</div>
          <div className="text-2xl font-bold">{units.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Occupied</div>
          <div className="text-2xl font-bold text-green-600">{occupiedUnits.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Available</div>
          <div className="text-2xl font-bold text-blue-600">{availableUnits.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Monthly Income</div>
          <div className="text-2xl font-bold">{formatCurrency(collectedRent)}</div>
          <div className="text-xs text-muted-foreground">of {formatCurrency(totalRent)} potential</div>
        </div>
      </div>

      {/* New Unit Form */}
      {showNewForm && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Add New Unit</h2>
          <form onSubmit={handleCreateUnit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit Name *</label>
              <input
                type="text"
                value={newUnit.unitName}
                onChange={(e) => setNewUnit(prev => ({ ...prev, unitName: e.target.value }))}
                placeholder="e.g., Room A, Unit 1, Back Room"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent (R)</label>
              <input
                type="number"
                value={newUnit.rentAmount}
                onChange={(e) => setNewUnit(prev => ({ ...prev, rentAmount: e.target.value }))}
                placeholder="3500"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deposit (R)</label>
              <input
                type="number"
                value={newUnit.depositAmount}
                onChange={(e) => setNewUnit(prev => ({ ...prev, depositAmount: e.target.value }))}
                placeholder="3500"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Occupants</label>
              <input
                type="number"
                value={newUnit.maxOccupants}
                onChange={(e) => setNewUnit(prev => ({ ...prev, maxOccupants: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newUnit.description}
                onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the unit..."
                className="w-full px-4 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newUnit.isFurnished}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, isFurnished: e.target.checked }))}
                />
                Furnished
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newUnit.hasOwnBathroom}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, hasOwnBathroom: e.target.checked }))}
                />
                Own Bathroom
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newUnit.hasOwnEntrance}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, hasOwnEntrance: e.target.checked }))}
                />
                Own Entrance
              </label>
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
                {submitting ? 'Adding...' : 'Add Unit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Units Grid */}
      {units.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="font-semibold mb-2">No units yet</h3>
          <p className="text-muted-foreground mb-4">
            Add units to manage this as a multi-tenant property
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Add First Unit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map(unit => (
            <div
              key={unit.id}
              className="bg-card border rounded-xl p-4 hover:border-primary transition cursor-pointer"
              onClick={() => router.push(`/agent/properties/${id}/units/${unit.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{unit.unit_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  unit.tenant_id ? 'bg-green-100 text-green-800' :
                  unit.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {unit.tenant_id ? 'Occupied' : unit.status}
                </span>
              </div>

              {unit.rent_amount && (
                <div className="text-lg font-bold mb-2">
                  {formatCurrency(Number(unit.rent_amount))}<span className="text-sm text-muted-foreground">/mo</span>
                </div>
              )}

              {unit.tenant_name && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">👤</div>
                  <div>
                    <div className="text-sm font-medium">{unit.tenant_name}</div>
                    <div className="text-xs text-muted-foreground">Current Tenant</div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {unit.is_furnished && <span className="px-2 py-1 bg-muted rounded">Furnished</span>}
                {unit.has_own_bathroom && <span className="px-2 py-1 bg-muted rounded">Own Bath</span>}
                {unit.has_own_entrance && <span className="px-2 py-1 bg-muted rounded">Own Entrance</span>}
                <span className="px-2 py-1 bg-muted rounded">Max {unit.max_occupants}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
