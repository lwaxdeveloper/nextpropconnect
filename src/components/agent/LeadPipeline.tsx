"use client";

import { useState } from "react";
import LeadCard from "./LeadCard";
import LeadDetail from "./LeadDetail";

interface Lead {
  id: number;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
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
  activities?: Array<{ id: number; activity_type: string; description: string; created_at: string }>;
}

const stages = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { key: "viewing_done", label: "Viewing Done", color: "bg-purple-500" },
  { key: "negotiating", label: "Negotiating", color: "bg-orange-500" },
  { key: "offer", label: "Offer", color: "bg-indigo-500" },
  { key: "won", label: "Won", color: "bg-green-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
];

export default function LeadPipeline({
  leads,
  onRefresh,
}: {
  leads: Lead[];
  onRefresh: () => void;
}) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [view, setView] = useState<"pipeline" | "table">("pipeline");
  const [loadingLead, setLoadingLead] = useState(false);

  async function openLead(lead: Lead) {
    setLoadingLead(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`);
      const data = await res.json();
      setSelectedLead(data);
    } finally {
      setLoadingLead(false);
    }
  }

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView("pipeline")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            view === "pipeline" ? "bg-dark text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pipeline
        </button>
        <button
          onClick={() => setView("table")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            view === "table" ? "bg-dark text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Table
        </button>
      </div>

      {loadingLead && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10">
          <div className="bg-white rounded-xl px-6 py-4 shadow-lg">Loading...</div>
        </div>
      )}

      {view === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.key);
            return (
              <div key={stage.key} className="min-w-[240px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold text-dark">{stage.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="text-xs text-gray-300 bg-gray-50 rounded-xl p-4 text-center">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onClick={() => openLead(lead)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Name</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Phone</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Property</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Priority</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => openLead(lead)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="py-3 px-3 font-medium text-dark">{lead.contact_name}</td>
                  <td className="py-3 px-3 text-gray-600">{lead.contact_phone || "—"}</td>
                  <td className="py-3 px-3 text-gray-600 truncate max-w-[200px]">{lead.property_title || "—"}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium`}>
                      <span className={`w-2 h-2 rounded-full ${
                        stages.find((s) => s.key === lead.status)?.color || "bg-gray-400"
                      }`} />
                      {lead.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium ${
                      lead.priority === "hot" ? "text-red-500" : lead.priority === "cold" ? "text-gray-400" : "text-blue-500"
                    }`}>
                      {lead.priority === "hot" ? "🔥" : lead.priority === "cold" ? "❄️" : "●"} {lead.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">
                    {lead.follow_up_date
                      ? new Date(lead.follow_up_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Slide-out */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead as Lead & { activities: Array<{ id: number; activity_type: string; description: string; created_at: string }> }}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            setSelectedLead(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
