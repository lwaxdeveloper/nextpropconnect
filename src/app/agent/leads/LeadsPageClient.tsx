"use client";

import { useState } from "react";
import LeadDetail from "@/components/agent/LeadDetail";

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
  updated_at: string;
}

interface Property {
  id: number;
  title: string;
  price: number;
}

const statuses = [
  { key: "", label: "All Statuses" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing_done", label: "Viewing Done" },
  { key: "negotiating", label: "Negotiating" },
  { key: "offer", label: "Offer" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const priorityOpts = [
  { key: "", label: "All Priorities" },
  { key: "hot", label: "🔥 Hot" },
  { key: "medium", label: "Medium" },
  { key: "cold", label: "❄️ Cold" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  viewing_done: "bg-purple-500",
  negotiating: "bg-orange-500",
  offer: "bg-indigo-500",
  won: "bg-green-500",
  lost: "bg-red-500",
};

export default function LeadsPageClient({ initialLeads, properties }: { initialLeads: Lead[]; properties: Property[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [newLead, setNewLead] = useState({
    contact_name: "", contact_phone: "", contact_email: "",
    property_id: "", source: "nextpropconnect", priority: "medium", budget: "",
  });

  const filtered = leads.filter((l) => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterPriority && l.priority !== filterPriority) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!l.contact_name.toLowerCase().includes(s) && !(l.contact_phone || "").includes(s)) return false;
    }
    return true;
  });

  async function refreshLeads() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data);
  }

  async function openLead(lead: Lead) {
    const res = await fetch(`/api/leads/${lead.id}`);
    const data = await res.json();
    setSelectedLead(data);
  }

  async function addLead() {
    if (!newLead.contact_name.trim()) return;
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newLead,
        property_id: newLead.property_id ? parseInt(newLead.property_id) : null,
        budget: newLead.budget ? parseFloat(newLead.budget) : null,
      }),
    });
    await refreshLeads();
    setShowAdd(false);
    setNewLead({ contact_name: "", contact_phone: "", contact_email: "", property_id: "", source: "nextpropconnect", priority: "medium", budget: "" });
  }

  async function bulkUpdateStatus(newStatus: string) {
    for (const id of selectedIds) {
      await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    }
    setSelectedIds(new Set());
    await refreshLeads();
  }

  async function deleteLead(id: number) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    await refreshLeads();
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Property", "Status", "Priority", "Budget", "Follow-up", "Created"];
    const rows = filtered.map((l) => [
      l.contact_name,
      l.contact_email || "",
      l.contact_phone || "",
      l.property_title || "",
      l.status,
      l.priority,
      l.budget ? l.budget.toString() : "",
      l.follow_up_date || "",
      new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)));
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
        >
          {statuses.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
        >
          {priorityOpts.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-dark text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-4 text-sm">
          <span className="font-medium">{selectedIds.size} selected</span>
          <select
            onChange={(e) => { if (e.target.value) bulkUpdateStatus(e.target.value); }}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
            defaultValue=""
          >
            <option value="" disabled>Change Status...</option>
            {statuses.filter((s) => s.key).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-gray-400 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 px-4 text-left">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" />
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Name</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Property</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Priority</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Follow-up</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Created</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    {search || filterStatus || filterPriority ? "No leads match your filters" : "No leads yet. Add your first lead!"}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => openLead(lead)} className="font-medium text-dark hover:text-primary transition text-left">
                        {lead.contact_name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{lead.contact_phone || "—"}</td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-[180px]">{lead.property_title || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full ${statusColors[lead.status] || "bg-gray-400"}`} />
                        {lead.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${
                        lead.priority === "hot" ? "text-red-500" : lead.priority === "cold" ? "text-gray-400" : "text-blue-500"
                      }`}>
                        {lead.priority === "hot" ? "🔥 Hot" : lead.priority === "cold" ? "❄️ Cold" : "● Medium"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {lead.follow_up_date
                        ? new Date(lead.follow_up_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => deleteLead(lead.id)} className="text-gray-300 hover:text-red-500 transition text-xs">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">{filtered.length} lead{filtered.length !== 1 ? "s" : ""} shown</p>

      {/* Lead Detail Slide-out */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead as Lead & { activities: Array<{ id: number; activity_type: string; description: string; created_at: string }> }}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { setSelectedLead(null); refreshLeads(); }}
        />
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-dark mb-4">Add New Lead</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Contact Name *" value={newLead.contact_name}
                onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
              <input type="tel" placeholder="Phone" value={newLead.contact_phone}
                onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
              <input type="email" placeholder="Email" value={newLead.contact_email}
                onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
              <select value={newLead.property_id} onChange={(e) => setNewLead({ ...newLead, property_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none">
                <option value="">No specific property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input type="number" placeholder="Budget (R)" value={newLead.budget}
                onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none">
                  <option value="nextpropconnect">NextPropConnect</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="other">Other</option>
                </select>
                <select value={newLead.priority} onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none">
                  <option value="hot">🔥 Hot</option>
                  <option value="medium">Medium</option>
                  <option value="cold">❄️ Cold</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm">Cancel</button>
              <button onClick={addLead} disabled={!newLead.contact_name.trim()} className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 text-sm">Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
