'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const categories = [
  'Plumbing',
  'Electrical', 
  'HVAC / Air Conditioning',
  'Appliances',
  'Structural',
  'Pest Control',
  'Security',
  'Cleaning',
  'Other'
];

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'normal',
    preferred_date: '',
    preferred_time: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Combine date and time for preferred_time
    let preferred_time = '';
    if (form.preferred_date) {
      preferred_time = form.preferred_date;
      if (form.preferred_time) {
        preferred_time += ' at ' + form.preferred_time;
      }
    }

    try {
      const res = await fetch('/api/renter/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          title: form.title,
          description: form.description,
          priority: form.priority,
          preferred_time,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      router.push('/renter/maintenance?success=1');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">🔧 Report an Issue</h1>
          <p className="text-gray-500 text-sm mb-6">Describe the maintenance issue and we'll notify your landlord.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brief Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g., Leaking tap in bathroom"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={4}
                placeholder="Please describe the issue in detail..."
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <div className="flex gap-3">
                {['normal', 'high', 'urgent'].map((p) => (
                  <label key={p} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition ${
                    form.priority === p 
                      ? p === 'urgent' ? 'border-red-500 bg-red-50' : p === 'high' ? 'border-orange-500 bg-orange-50' : 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={form.priority === p}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="sr-only"
                    />
                    <span className="font-medium capitalize">{p}</span>
                    {p === 'urgent' && <span className="block text-xs text-red-600">Safety hazard</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Access Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Access Time (optional)</label>
              <p className="text-xs text-gray-500 mb-2">When can a technician access your unit?</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.preferred_date}
                    onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Time</label>
                  <select
                    value={form.preferred_time}
                    onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Any time</option>
                    <option value="08:00 - 10:00">08:00 - 10:00</option>
                    <option value="10:00 - 12:00">10:00 - 12:00</option>
                    <option value="12:00 - 14:00">12:00 - 14:00</option>
                    <option value="14:00 - 16:00">14:00 - 16:00</option>
                    <option value="16:00 - 18:00">16:00 - 18:00</option>
                    <option value="After 18:00">After 18:00</option>
                    <option value="Weekends only">Weekends only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
