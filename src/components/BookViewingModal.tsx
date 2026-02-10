"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BookViewingModalProps {
  propertyId: number;
  propertyTitle: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookViewingModal({
  propertyId,
  propertyTitle,
  agentName,
  isOpen,
  onClose,
}: BookViewingModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate time slots (8am - 6pm, 30min intervals)
  const timeSlots: TimeSlot[] = [];
  for (let h = 8; h <= 18; h++) {
    const time1 = `${h.toString().padStart(2, "0")}:00`;
    const time2 = `${h.toString().padStart(2, "0")}:30`;
    timeSlots.push({ time: time1, available: true });
    if (h < 18) timeSlots.push({ time: time2, available: true });
  }

  // Fetch booked slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate, propertyId]);

  const fetchBookedSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(`/api/viewings/slots?property_id=${propertyId}&date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedSlots || []);
      }
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId }),
      });

      if (!convRes.ok) {
        const data = await convRes.json();
        if (convRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.error || "Failed to start conversation");
      }

      const conv = await convRes.json();

      const viewRes = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          conversation_id: conv.id,
          proposed_date: selectedDate.toISOString().split("T")[0],
          proposed_time: selectedTime,
          notes: notes || null,
        }),
      });

      if (!viewRes.ok) {
        const data = await viewRes.json();
        throw new Error(data.error || "Failed to book viewing");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push(`/messages/${conv.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const isDateSelectable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= today && date.getDay() !== 0; // Not past, not Sunday
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const selectDate = (day: number) => {
    if (isDateSelectable(day)) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      setSelectedTime(""); // Reset time when date changes
    }
  };

  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isSlotAvailable = (time: string) => !bookedSlots.includes(time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Viewing Requested!</h3>
            <p className="text-gray-600">Redirecting to chat...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">📅 Book a Viewing</h2>
              <p className="text-sm text-gray-500 line-clamp-1">{propertyTitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
              )}

              {/* Calendar */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  {dayNames.map((d) => (
                    <div key={d} className="font-medium text-gray-500 py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startingDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selectable = isDateSelectable(day);
                    const selected = isDateSelected(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDate(day)}
                        disabled={!selectable}
                        className={`
                          p-2 text-sm rounded-lg transition
                          ${selected ? "bg-primary text-white font-semibold" : ""}
                          ${selectable && !selected ? "hover:bg-primary/10 text-gray-700" : ""}
                          ${!selectable ? "text-gray-300 cursor-not-allowed" : ""}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time for {selectedDate.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "short" })}
                  </label>
                  {loadingSlots ? (
                    <div className="text-center py-4 text-gray-500">Loading available slots...</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(({ time }) => {
                        const available = isSlotAvailable(time);
                        const selected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => available && setSelectedTime(time)}
                            disabled={!available}
                            className={`
                              py-2 px-3 text-sm rounded-lg border transition
                              ${selected ? "bg-primary text-white border-primary" : ""}
                              ${available && !selected ? "border-gray-200 hover:border-primary hover:bg-primary/5" : ""}
                              ${!available ? "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed line-through" : ""}
                            `}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific requests..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition resize-none text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !selectedDate || !selectedTime}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Request Viewing
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                {agentName} will confirm your viewing via chat
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
