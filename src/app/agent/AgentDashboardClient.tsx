"use client";

import { useState } from "react";
import StatsCard from "@/components/agent/StatsCard";
import LeadPipeline from "@/components/agent/LeadPipeline";

interface Lead {
  id: number;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  property_id?: number;
  property_title?: string;
  property_price?: number;
  status: string;
  priority: string;
  budget?: number;
  notes?: string;
  follow_up_date?: string;
  source?: string;
  created_at: string;
}

interface Props {
  stats: {
    activeListings: number;
    totalViews: number;
    openLeads: number;
    unreadMessages: number;
  };
  leads: Lead[];
  listings: unknown[];
  conversations: unknown[];
  formatPrice: null;
}

export default function AgentDashboardClient({ stats, leads: initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ contact_name: "", contact_phone: "", contact_email: "", source: "nextpropconnect", priority: "medium" });
  const [adding, setAdding] = useState(false);

  async function refreshLeads() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data);
  }

  async function addLead() {
    if (!newLead.contact_name.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      await refreshLeads();
      setShowAddLead(false);
      setNewLead({ contact_name: "", contact_phone: "", contact_email: "", source: "nextpropconnect", priority: "medium" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon="🏠" label="Active Listings" value={stats.activeListings} />
        <StatsCard icon="👁️" label="Total Views" value={stats.totalViews} />
        <StatsCard icon="👥" label="Open Leads" value={stats.openLeads} href="/agent/leads" />
        <StatsCard icon="💬" label="Unread Messages" value={stats.unreadMessages} href="/messages" />
      </div>

      {/* Lead Pipeline */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark">Lead Pipeline</h2>
          <button
            onClick={() => setShowAddLead(true)}
            className="px-4 py-2 bg-dark text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
          >
            + Add Lead
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="font-bold text-dark text-lg mb-2">No leads yet</h3>
            <p className="text-sm text-gray-500 mb-6">Add your first lead to start tracking your pipeline.</p>
            <button
              onClick={() => setShowAddLead(true)}
              className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              Add First Lead
            </button>
          </div>
        ) : (
          <LeadPipeline leads={leads} onRefresh={refreshLeads} />
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddLead(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-dark mb-4">Add New Lead</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Contact Name *"
                value={newLead.contact_name}
                onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newLead.contact_phone}
                onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={newLead.contact_email}
                onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
                >
                  <option value="nextpropconnect">NextPropConnect</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={newLead.priority}
                  onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
                >
                  <option value="hot">🔥 Hot</option>
                  <option value="medium">Medium</option>
                  <option value="cold">❄️ Cold</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddLead(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addLead}
                disabled={adding || !newLead.contact_name.trim()}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 text-sm"
              >
                {adding ? "Adding..." : "Add Lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
