"use client";

import { useState } from "react";

interface ProfileData {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  profile: {
    bio?: string;
    areas_served?: string[];
    specializations?: string[];
    commission_rate?: number;
    eaab_number?: string;
    ffc_number?: string;
    show_phone?: boolean;
    enable_whatsapp?: boolean;
    agency_name?: string;
  } | null;
}

const allAreas = [
  "Sandton", "Midrand", "Johannesburg CBD", "Boksburg", "Benoni",
  "Kempton Park", "Centurion", "Pretoria", "Soweto", "Randburg",
  "Roodepoort", "Fourways", "Bryanston", "Rosebank", "Edenvale",
  "Germiston", "Springs", "Cape Town", "Durban", "Port Elizabeth",
];

const allSpecs = [
  "Residential Sales", "Residential Rentals", "Commercial", "Industrial",
  "Land", "Estates", "Sectional Title", "First-time Buyers", "Luxury",
  "Investment Properties", "Township Properties", "Off-plan",
];

export default function ProfileForm({ data, onSave }: { data: ProfileData; onSave: () => void }) {
  const [name, setName] = useState(data.user.name || "");
  const [phone, setPhone] = useState(data.user.phone || "");
  const [bio, setBio] = useState(data.profile?.bio || "");
  const [areas, setAreas] = useState<string[]>(data.profile?.areas_served || []);
  const [specs, setSpecs] = useState<string[]>(data.profile?.specializations || []);
  const [commission, setCommission] = useState(data.profile?.commission_rate?.toString() || "");
  const [eaab, setEaab] = useState(data.profile?.eaab_number || "");
  const [ffc, setFfc] = useState(data.profile?.ffc_number || "");
  const [showPhone, setShowPhone] = useState(data.profile?.show_phone !== false);
  const [enableWA, setEnableWA] = useState(data.profile?.enable_whatsapp !== false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [specInput, setSpecInput] = useState("");

  function toggleArea(area: string) {
    setAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  }

  function toggleSpec(spec: string) {
    setSpecs((prev) => prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/agent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          bio,
          areas_served: areas,
          specializations: specs,
          commission_rate: commission ? parseFloat(commission) : null,
          eaab_number: eaab || null,
          ffc_number: ffc || null,
          show_phone: showPhone,
          enable_whatsapp: enableWA,
        }),
      });
      setSaved(true);
      onSave();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              value={data.user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 XX XXX XXXX"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell buyers about yourself, your experience, and what makes you different..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Areas Served */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Areas Served</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {allAreas.map((area) => (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                areas.includes(area)
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            placeholder="Add custom area..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && areaInput.trim()) {
                setAreas([...areas, areaInput.trim()]);
                setAreaInput("");
              }
            }}
          />
        </div>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {areas.map((area) => (
              <span key={area} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {area}
                <button onClick={() => toggleArea(area)} className="text-primary hover:text-red-500 ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Specializations</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {allSpecs.map((spec) => (
            <button
              key={spec}
              onClick={() => toggleSpec(spec)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                specs.includes(spec)
                  ? "bg-secondary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            placeholder="Add custom specialization..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && specInput.trim()) {
                setSpecs([...specs, specInput.trim()]);
                setSpecInput("");
              }
            }}
          />
        </div>
      </div>

      {/* Professional Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Professional Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Commission Rate (%)</label>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="e.g. 5.50"
              step="0.25"
              min="0"
              max="10"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">EAAB Number</label>
            <input
              type="text"
              value={eaab}
              onChange={(e) => setEaab(e.target.value)}
              placeholder="e.g. EAAB12345"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">FFC Number</label>
            <input
              type="text"
              value={ffc}
              onChange={(e) => setFfc(e.target.value)}
              placeholder="e.g. FFC2026/001"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-dark mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-dark">Show phone number publicly</p>
              <p className="text-xs text-gray-400">Buyers can see your phone number on listings</p>
            </div>
            <div
              onClick={() => setShowPhone(!showPhone)}
              className={`w-12 h-6 rounded-full transition ${showPhone ? "bg-primary" : "bg-gray-300"} relative`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showPhone ? "translate-x-6" : "translate-x-0.5"}`} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-dark">Enable WhatsApp contact</p>
              <p className="text-xs text-gray-400">Show WhatsApp button on your profile</p>
            </div>
            <div
              onClick={() => setEnableWA(!enableWA)}
              className={`w-12 h-6 rounded-full transition ${enableWA ? "bg-primary" : "bg-gray-300"} relative`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enableWA ? "translate-x-6" : "translate-x-0.5"}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 font-bold rounded-xl transition text-sm ${
          saved
            ? "bg-green-500 text-white"
            : "bg-primary text-white hover:bg-primary-dark"
        } disabled:opacity-50`}
      >
        {saving ? "Saving..." : saved ? "✓ Profile Saved!" : "Save Profile"}
      </button>
    </div>
  );
}
