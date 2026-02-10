"use client";

import { useState } from "react";

interface Props {
  initialPhone: string;
  initialEnabled: boolean;
}

export default function WhatsAppSettings({ initialPhone, initialEnabled }: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, whatsapp_enabled: enabled }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        return;
      }

      setMessage({ type: "success", text: "Settings saved!" });
      setPhone(data.phone || "");
      setEnabled(data.whatsapp_enabled || false);
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Phone Number Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g., 0780193677 or +27780193677"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-gray-400 mt-1">
          South African number. We&apos;ll add the country code automatically.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-dark">Enable WhatsApp notifications</p>
          <p className="text-sm text-gray-500">
            Receive new message alerts on WhatsApp
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              enabled ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {/* What you'll receive */}
      {enabled && (
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            You&apos;ll receive WhatsApp notifications for:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✓ New messages from buyers/agents</li>
            <li>✓ Property alerts matching your criteria</li>
            <li>✓ Viewing reminders</li>
            <li>✓ Important updates</li>
          </ul>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

      {/* Status Message */}
      {message && (
        <p
          className={`text-sm text-center ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
