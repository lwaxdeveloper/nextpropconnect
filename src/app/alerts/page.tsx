"use client";

import { useState, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, MapPin, DollarSign, BedDouble } from "lucide-react";

interface PropertyAlert {
  id: number;
  listing_type: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null;
  province: string | null;
  city: string | null;
  suburb: string | null;
  is_active: boolean;
  created_at: string;
  last_sent_at: string | null;
}

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Vacant Land" },
  { value: "commercial", label: "Commercial" },
  { value: "farm", label: "Farm" },
];

export default function AlertsPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status || "loading";
  const router = useRouter();
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    listing_type: "",
    property_type: "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    province: "",
    city: "",
    suburb: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/alerts");
    } else if (status === "authenticated") {
      fetchAlerts();
    }
  }, [status, router]);

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
    } finally {
      setLoading(false);
    }
  }

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_type: form.listing_type || null,
          property_type: form.property_type || null,
          min_price: form.min_price ? parseInt(form.min_price) : null,
          max_price: form.max_price ? parseInt(form.max_price) : null,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          province: form.province || null,
          city: form.city || null,
          suburb: form.suburb || null,
        }),
      });
      if (res.ok) {
        const newAlert = await res.json();
        setAlerts([newAlert, ...alerts]);
        setShowForm(false);
        setForm({
          listing_type: "",
          property_type: "",
          min_price: "",
          max_price: "",
          bedrooms: "",
          province: "",
          city: "",
          suburb: "",
        });
      }
    } catch (e) {
      console.error("Failed to create alert:", e);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAlert(id: number, is_active: boolean) {
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !is_active }),
      });
      if (res.ok) {
        setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_active: !is_active } : a)));
      }
    } catch (e) {
      console.error("Failed to toggle alert:", e);
    }
  }

  async function deleteAlert(id: number) {
    if (!confirm("Delete this alert?")) return;
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts(alerts.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete alert:", e);
    }
  }

  function formatPrice(price: number | null): string {
    if (!price) return "";
    return `R ${price.toLocaleString("en-ZA")}`;
  }

  function getAlertLabel(alert: PropertyAlert): string {
    const parts: string[] = [];
    if (alert.listing_type) parts.push(alert.listing_type === "sale" ? "For Sale" : "To Rent");
    if (alert.property_type) {
      const pt = PROPERTY_TYPES.find((p) => p.value === alert.property_type);
      parts.push(pt?.label || alert.property_type);
    }
    if (alert.city) parts.push(alert.city);
    else if (alert.province) parts.push(alert.province);
    return parts.length > 0 ? parts.join(" • ") : "All Properties";
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Property Alerts</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Create Form */}
        {showForm && (
          <form onSubmit={createAlert} className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create Property Alert</h2>
            <p className="text-gray-600 text-sm mb-4">
              Get notified via WhatsApp and email when new properties match your criteria.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                <select
                  value={form.listing_type}
                  onChange={(e) => setForm({ ...form, listing_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Any</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">To Rent</option>
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={form.property_type}
                  onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Any</option>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  value={form.min_price}
                  onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                  placeholder="e.g. 500000"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  value={form.max_price}
                  onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                  placeholder="e.g. 2000000"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Bedrooms</label>
                <select
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Any</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Johannesburg"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Suburb */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                <input
                  type="text"
                  value={form.suburb}
                  onChange={(e) => setForm({ ...form, suburb: e.target.value })}
                  placeholder="e.g. Sandton"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Alert"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Property Alerts</h2>
            <p className="text-gray-500 mb-4">
              Create an alert to get notified when properties matching your criteria are listed.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${!alert.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{getAlertLabel(alert)}</span>
                      {!alert.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Paused</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {(alert.min_price || alert.max_price) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {alert.min_price && alert.max_price
                            ? `${formatPrice(alert.min_price)} - ${formatPrice(alert.max_price)}`
                            : alert.min_price
                            ? `From ${formatPrice(alert.min_price)}`
                            : `Up to ${formatPrice(alert.max_price)}`}
                        </span>
                      )}
                      {alert.bedrooms && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          {alert.bedrooms}+ beds
                        </span>
                      )}
                      {(alert.suburb || alert.city || alert.province) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {[alert.suburb, alert.city, alert.province].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>

                    {alert.last_sent_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Last match: {new Date(alert.last_sent_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, alert.is_active)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title={alert.is_active ? "Pause alert" : "Resume alert"}
                    >
                      {alert.is_active ? (
                        <ToggleRight className="w-6 h-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Delete alert"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
          <h3 className="font-medium mb-2">📬 How Alerts Work</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>When a new property is listed matching your criteria, you'll be notified</li>
            <li>Notifications are sent via WhatsApp (if enabled) and email</li>
            <li>You can pause or delete alerts at any time</li>
            <li>
              <a href="/settings" className="underline">
                Manage your notification preferences
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
