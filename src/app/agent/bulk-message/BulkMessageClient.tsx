"use client";

import { useState } from "react";
import { Send, Users, CheckCircle, AlertCircle, Filter } from "lucide-react";

interface Lead {
  id: number;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  status: string;
  priority: string;
  property_title: string | null;
}

interface Template {
  id: number;
  name: string;
  content: string;
}

interface Props {
  leads: Lead[];
  templates: Template[];
}

export default function BulkMessageClient({ leads, templates }: Props) {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Filter leads with phone numbers
  const leadsWithPhone = leads.filter((l) => l.contact_phone);
  
  const filteredLeads = leadsWithPhone.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (priorityFilter !== "all" && l.priority !== priorityFilter) return false;
    return true;
  });

  const toggleLead = (id: number) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedLeads(filteredLeads.map((l) => l.id));
  };

  const deselectAll = () => {
    setSelectedLeads([]);
  };

  const applyTemplate = (content: string) => {
    setMessage(content);
  };

  const sendMessages = async () => {
    if (selectedLeads.length === 0 || !message.trim()) return;

    setSending(true);
    setResults(null);

    let success = 0;
    let failed = 0;

    for (const leadId of selectedLeads) {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead?.contact_phone) {
        failed++;
        continue;
      }

      // Personalize message
      const personalizedMessage = message
        .replace(/\{name\}/gi, lead.contact_name)
        .replace(/\{property\}/gi, lead.property_title || "your inquiry");

      try {
        const res = await fetch("/api/bulk-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            phone: lead.contact_phone,
            message: personalizedMessage,
          }),
        });

        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // Small delay between messages to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    setSending(false);
    setResults({ success, failed });
    
    // Clear selection after sending
    if (success > 0) {
      setSelectedLeads([]);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Lead Selection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-dark flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Recipients
          </h2>
          <span className="text-sm text-gray-500">
            {selectedLeads.length} of {filteredLeads.length} selected
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 text-sm border rounded-lg px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="viewing_done">Viewing Done</option>
            <option value="negotiating">Negotiating</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 text-sm border rounded-lg px-3 py-2"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={selectAll}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
          >
            Deselect All
          </button>
        </div>

        {/* Lead List */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📱</div>
            <p>No leads with phone numbers</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredLeads.map((lead) => (
              <label
                key={lead.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                  selectedLeads.includes(lead.id)
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => toggleLead(lead.id)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark text-sm truncate">
                    {lead.contact_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {lead.contact_phone}
                    {lead.property_title && ` • ${lead.property_title}`}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    lead.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : lead.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {lead.priority}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Message Composer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Compose Message
        </h2>

        {/* Templates */}
        {templates.length > 0 && (
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Use Template</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.content)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here...

Use {name} for recipient's name
Use {property} for property title"
            rows={6}
            className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-gray-400 mt-1">
            {message.length} characters
          </p>
        </div>

        {/* Preview */}
        {message && selectedLeads.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-xl">
            <p className="text-xs text-green-600 font-medium mb-1">Preview (for first recipient)</p>
            <p className="text-sm text-green-800 whitespace-pre-wrap">
              {message
                .replace(/\{name\}/gi, leads.find((l) => l.id === selectedLeads[0])?.contact_name || "Customer")
                .replace(/\{property\}/gi, leads.find((l) => l.id === selectedLeads[0])?.property_title || "your inquiry")}
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className={`mb-4 p-3 rounded-xl ${results.failed > 0 ? "bg-yellow-50" : "bg-green-50"}`}>
            <div className="flex items-center gap-2">
              {results.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                {results.success} sent successfully
                {results.failed > 0 && `, ${results.failed} failed`}
              </span>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={sendMessages}
          disabled={sending || selectedLeads.length === 0 || !message.trim()}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to {selectedLeads.length} {selectedLeads.length === 1 ? "Lead" : "Leads"}
            </>
          )}
        </button>

        {/* Warning */}
        <p className="text-xs text-gray-400 text-center mt-3">
          Messages will be sent via WhatsApp. Standard messaging rates may apply.
        </p>
      </div>
    </div>
  );
}
