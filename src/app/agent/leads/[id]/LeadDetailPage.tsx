"use client";

import { useState } from "react";
import Link from "next/link";
import ActivityTimeline from "@/components/agent/ActivityTimeline";

interface Activity {
  id: number;
  activity_type: string;
  description: string;
  created_at: string;
}

interface Lead {
  id: number;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  property_id?: number;
  property_title?: string;
  property_price?: number;
  property_image?: string;
  listing_type?: string;
  status: string;
  priority: string;
  budget?: number;
  notes?: string;
  follow_up_date?: string;
  source?: string;
  created_at: string;
  activities: Activity[];
}

const statuses = ["new", "contacted", "viewing_done", "negotiating", "offer", "won", "lost"];
const priorities = ["hot", "medium", "cold"];
const activityTypes = [
  { value: "note", label: "📝 Note" },
  { value: "call", label: "📞 Call" },
  { value: "email", label: "📧 Email" },
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "viewing", label: "🏠 Viewing" },
  { value: "offer", label: "💰 Offer" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  viewing_done: "bg-purple-100 text-purple-700",
  negotiating: "bg-orange-100 text-orange-700",
  offer: "bg-indigo-100 text-indigo-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export default function LeadDetailPage({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status);
  const [priority, setPriority] = useState(lead.priority);
  const [budget, setBudget] = useState(lead.budget?.toString() || "");
  const [followUp, setFollowUp] = useState(lead.follow_up_date?.split("T")[0] || "");
  const [notes, setNotes] = useState(lead.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activityDesc, setActivityDesc] = useState("");
  const [activities, setActivities] = useState(lead.activities);

  async function saveLead() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          budget: budget ? parseFloat(budget) : null,
          follow_up_date: followUp || null,
          notes,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function addActivity() {
    if (!activityDesc.trim()) return;
    const res = await fetch(`/api/leads/${lead.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity_type: activityType, description: activityDesc }),
    });
    const newAct = await res.json();
    setActivities([newAct, ...activities]);
    setActivityDesc("");
  }

  return (
    <div>
      <Link href="/agent/leads" className="text-sm text-gray-500 hover:text-primary transition mb-4 inline-block">
        ← Back to Leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-dark">{lead.contact_name}</h1>
                <p className="text-xs text-gray-400 capitalize mt-1">Source: {lead.source || "nextpropconnect"} · Added {new Date(lead.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || "bg-gray-100 text-gray-600"}`}>
                {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {lead.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📞</span>
                  <span className="text-gray-700">{lead.contact_phone}</span>
                </div>
              )}
              {lead.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📧</span>
                  <span className="text-gray-700">{lead.contact_email}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {lead.contact_phone && (
                <a
                  href={`https://wa.me/${lead.contact_phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-50 text-green-600 text-sm font-semibold rounded-xl hover:bg-green-100 transition"
                >
                  💬 WhatsApp
                </a>
              )}
              {lead.contact_phone && (
                <a href={`tel:${lead.contact_phone}`} className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-100 transition">
                  📞 Call
                </a>
              )}
              {lead.contact_email && (
                <a href={`mailto:${lead.contact_email}`} className="px-4 py-2 bg-purple-50 text-purple-600 text-sm font-semibold rounded-xl hover:bg-purple-100 transition">
                  📧 Email
                </a>
              )}
            </div>
          </div>

          {/* Property */}
          {lead.property_title && (
            <Link
              href={`/properties/${lead.property_id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition"
            >
              <p className="text-xs text-gray-400 mb-2">Property of Interest</p>
              <div className="flex gap-4">
                {lead.property_image ? (
                  <img src={lead.property_image} alt="" className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-2xl text-gray-300">🏠</div>
                )}
                <div>
                  <h3 className="font-bold text-dark">{lead.property_title}</h3>
                  {lead.property_price && (
                    <p className="text-primary font-bold">R{Number(lead.property_price).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Add Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-dark mb-3">Log Activity</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {activityTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setActivityType(t.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    activityType === t.value ? "bg-dark text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)}
                placeholder="What happened?"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
                onKeyDown={(e) => e.key === "Enter" && addActivity()}
              />
              <button
                onClick={addActivity}
                disabled={!activityDesc.trim()}
                className="px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 text-sm"
              >
                Log
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>{p === "hot" ? "🔥 Hot" : p === "cold" ? "❄️ Cold" : "Medium"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Budget (R)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 1500000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Follow-up Date</label>
              <input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none resize-none"
                placeholder="Add notes..."
              />
            </div>
            <button
              onClick={saveLead}
              disabled={saving}
              className={`w-full py-3 font-semibold rounded-xl transition text-sm ${
                saved ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary-dark"
              } disabled:opacity-50`}
            >
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
