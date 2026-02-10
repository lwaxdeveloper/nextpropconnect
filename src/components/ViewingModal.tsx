"use client";

import { useState } from "react";

interface ViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, time: string, notes: string) => void;
  loading?: boolean;
}

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

export default function ViewingModal({ isOpen, onClose, onSubmit, loading }: ViewingModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  // min: tomorrow, max: 30 days out
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const minStr = tomorrow.toISOString().split("T")[0];
  const maxStr = maxDate.toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit(date, time, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-dark">Schedule a Viewing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📅 Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minStr}
              max={maxStr}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🕐 Select Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    time === slot
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or questions..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!date || !time || loading}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Sending Request…" : "📅 Request Viewing"}
          </button>
        </form>
      </div>
    </div>
  );
}
