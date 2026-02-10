"use client";

interface Lead {
  id: number;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  property_title?: string;
  property_price?: number;
  status: string;
  priority: string;
  budget?: number;
  follow_up_date?: string;
  created_at: string;
  source?: string;
}

const priorityBadge: Record<string, { label: string; className: string }> = {
  hot: { label: "🔥 Hot", className: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "Medium", className: "bg-blue-50 text-blue-600 border-blue-200" },
  cold: { label: "❄️ Cold", className: "bg-gray-50 text-gray-500 border-gray-200" },
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  viewing_done: "bg-purple-500",
  negotiating: "bg-orange-500",
  offer: "bg-indigo-500",
  won: "bg-green-500",
  lost: "bg-red-500",
};

export default function LeadCard({ lead, onClick }: { lead: Lead; onClick?: () => void }) {
  const badge = priorityBadge[lead.priority] || priorityBadge.medium;
  const daysAgo = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const followUp = lead.follow_up_date ? new Date(lead.follow_up_date) : null;
  const isOverdue = followUp && followUp < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 hover:border-primary/30 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[lead.status] || "bg-gray-400"}`} />
          <h3 className="font-semibold text-dark text-sm">{lead.contact_name}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {lead.contact_phone && (
        <p className="text-xs text-gray-500 mb-1">📞 {lead.contact_phone}</p>
      )}

      {lead.property_title && (
        <p className="text-xs text-gray-600 mb-1 truncate">🏠 {lead.property_title}</p>
      )}

      {lead.budget && (
        <p className="text-xs text-gray-500 mb-2">
          💰 Budget: R{Number(lead.budget).toLocaleString()}
        </p>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <span className="text-[11px] text-gray-400">{daysAgo}d ago</span>
        {followUp && (
          <span className={`text-[11px] ${isOverdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            📅 {followUp.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
            {isOverdue && " ⚠️"}
          </span>
        )}
      </div>
    </div>
  );
}
