"use client";

import { useState } from "react";

interface ViewingData {
  viewing_id: number;
  date: string;
  time: string;
  date_display: string;
  notes?: string | null;
  status: string;
}

interface ViewingRequestCardProps {
  viewing: ViewingData;
  isOwn: boolean;
  conversationId: number;
  onAction?: (viewingId: number, status: string) => void;
}

export default function ViewingRequestCard({ viewing, isOwn, conversationId, onAction }: ViewingRequestCardProps) {
  const [loading, setLoading] = useState(false);
  void conversationId; // used by parent

  const handleAction = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/viewings/${viewing.viewing_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok && onAction) {
        onAction(viewing.viewing_id, status);
      }
    } catch (err) {
      console.error("Failed to update viewing:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { icon: string; text: string; color: string }> = {
    pending: { icon: "📅", text: "Viewing requested", color: "border-blue-300 bg-blue-50" },
    confirmed: { icon: "✅", text: "Viewing confirmed", color: "border-green-300 bg-green-50" },
    declined: { icon: "❌", text: "Viewing declined", color: "border-red-300 bg-red-50" },
    cancelled: { icon: "🚫", text: "Viewing cancelled", color: "border-gray-300 bg-gray-50" },
  };

  const config = statusConfig[viewing.status] || statusConfig.pending;

  return (
    <div className={`border-2 rounded-2xl p-4 ${config.color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <span className="font-semibold text-sm text-dark">{config.text}</span>
      </div>
      <p className="text-sm text-gray-700 mb-1">
        📅 {viewing.date_display} at {viewing.time}
      </p>
      {viewing.notes && (
        <p className="text-xs text-gray-500 italic mb-2">"{viewing.notes}"</p>
      )}

      {/* Show Confirm/Decline buttons only for pending viewings the other person requested */}
      {viewing.status === "pending" && !isOwn && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleAction("confirmed")}
            disabled={loading}
            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          >
            ✓ Confirm
          </button>
          <button
            onClick={() => handleAction("declined")}
            disabled={loading}
            className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 transition disabled:opacity-50"
          >
            ✗ Decline
          </button>
        </div>
      )}

      {viewing.status === "pending" && isOwn && (
        <p className="text-xs text-gray-500 mt-2 italic">Waiting for response…</p>
      )}
    </div>
  );
}
