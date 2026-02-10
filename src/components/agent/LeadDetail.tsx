"use client";

import { useState } from "react";
import ActivityTimeline from "./ActivityTimeline";

interface Activity {
  id: number;
  activity_type: string;
  description: string;
  created_at: string;
}

interface LeadData {
  id: number;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  property_id?: number;
  property_title?: string;
  property_price?: number;
  property_image?: string;
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

export default function LeadDetail({
  lead,
  onClose,
  onUpdate,
}: {
  lead: LeadData;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState(lead.status);
  const [priority, setPriority] = useState(lead.priority);
  const [followUp, setFollowUp] = useState(lead.follow_up_date?.split("T")[0] || "");
  const [notes, setNotes] = useState(lead.notes || "");
  const [saving, setSaving] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activityDesc, setActivityDesc] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [activities, setActivities] = useState(lead.activities || []);

  async function saveLead() {
    setSaving(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, follow_up_date: followUp || null, notes }),
      });
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  async function addActivity() {
    if (!activityDesc.trim()) return;
    setAddingActivity(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_type: activityType, description: activityDesc }),
      });
      const newActivity = await res.json();
      setActivities([newActivity, ...activities]);
      setActivityDesc("");
    } finally {
      setAddingActivity(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl animate-slide-in">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-dark">Lead Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-black text-dark">{lead.contact_name}</h3>
            <div className="mt-2 space-y-1">
              {lead.contact_email && (
                <p className="text-sm text-gray-600">📧 {lead.contact_email}</p>
              )}
              {lead.contact_phone && (
                <p className="text-sm text-gray-600">📞 {lead.contact_phone}</p>
              )}
              <p className="text-xs text-gray-400 capitalize">Source: {lead.source || "nextpropconnect"}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              {lead.contact_phone && (
                <a
                  href={`https://wa.me/${lead.contact_phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 transition"
                >
                  💬 WhatsApp
                </a>
              )}
              {lead.contact_phone && (
                <a
                  href={`tel:${lead.contact_phone}`}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition"
                >
                  📞 Call
                </a>
              )}
              {lead.contact_email && (
                <a
                  href={`mailto:${lead.contact_email}`}
                  className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-lg hover:bg-purple-100 transition"
                >
                  📧 Email
                </a>
              )}
            </div>
          </div>

          {/* Property Card */}
          {lead.property_title && (
            <a
              href={lead.property_id ? `/properties/${lead.property_id}` : "#"}
              className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition"
            >
              <div className="flex gap-3">
                {lead.property_image && (
                  <img src={lead.property_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div>
                  <p className="text-sm font-semibold text-dark">{lead.property_title}</p>
                  {lead.property_price && (
                    <p className="text-sm text-primary font-bold">
                      R{Number(lead.property_price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </a>
          )}

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p === "hot" ? "🔥 Hot" : p === "cold" ? "❄️ Cold" : "Medium"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Follow-up Date</label>
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
              placeholder="Add notes about this lead..."
            />
          </div>

          <button
            onClick={saveLead}
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {/* Add Activity */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-bold text-dark text-sm mb-3">Add Activity</h4>
            <div className="flex gap-2 mb-2">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
              >
                {activityTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)}
                placeholder="What happened?"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                onKeyDown={(e) => e.key === "Enter" && addActivity()}
              />
              <button
                onClick={addActivity}
                disabled={addingActivity || !activityDesc.trim()}
                className="px-4 py-2 bg-dark text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <ActivityTimeline activities={activities} />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
