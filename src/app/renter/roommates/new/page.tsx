"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const cities = [
  "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
  "Bloemfontein", "East London", "Polokwane", "Nelspruit", "Kimberley",
  "Sandton", "Centurion", "Midrand", "Randburg", "Roodepoort",
];

const provinces = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

export default function NewRoommateListing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [listingType, setListingType] = useState<"looking" | "offering">("looking");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    city: "",
    province: "",
    area: "",
    // For "looking"
    budget_min: "",
    budget_max: "",
    move_in_date: "",
    // For "offering"
    rent_amount: "",
    deposit_amount: "",
    available_from: "",
    is_furnished: false,
    has_own_bathroom: false,
    // Preferences
    preferred_gender: "",
    smoker_friendly: false,
    pet_friendly: false,
    couples_ok: false,
    // About me
    my_age: "",
    my_gender: "",
    my_occupation: "",
    about_me: "",
    lifestyle: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/roommates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: listingType }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/renter/roommates/${data.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create listing");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/renter/roommates" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Roommates
        </Link>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">Post a Roommate Listing</h1>
          <p className="text-gray-500 mb-6">Find the perfect roommate or share your space</p>

          {/* Listing Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setListingType("looking")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  listingType === "looking"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-3xl block mb-2">🔍</span>
                <span className="font-semibold">Looking for a room</span>
                <p className="text-xs text-gray-500 mt-1">I need a place to stay</p>
              </button>
              <button
                type="button"
                onClick={() => setListingType("offering")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  listingType === "offering"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-3xl block mb-2">🏠</span>
                <span className="font-semibold">Offering a room</span>
                <p className="text-xs text-gray-500 mt-1">I have space to share</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Listing Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder={listingType === "looking" ? "e.g., Young professional looking for room in Sandton" : "e.g., Cozy room available in shared apartment"}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder={listingType === "looking" ? "Tell people about yourself and what you're looking for..." : "Describe the room, amenities, house rules..."}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none resize-none"
              />
            </div>

            {/* Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                >
                  <option value="">Select province</option>
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area / Suburb</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="e.g., Rosebank, Braamfontein"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
              />
            </div>

            {/* Budget/Price */}
            {listingType === "looking" ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget (R/month)</label>
                  <input
                    type="number"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    placeholder="2000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget (R/month)</label>
                  <input
                    type="number"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    placeholder="5000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rent (R/month) *</label>
                  <input
                    type="number"
                    name="rent_amount"
                    value={formData.rent_amount}
                    onChange={handleChange}
                    required
                    placeholder="3500"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deposit (R)</label>
                  <input
                    type="number"
                    name="deposit_amount"
                    value={formData.deposit_amount}
                    onChange={handleChange}
                    placeholder="3500"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {listingType === "looking" ? "Preferred Move-in Date" : "Available From"}
              </label>
              <input
                type="date"
                name={listingType === "looking" ? "move_in_date" : "available_from"}
                value={listingType === "looking" ? formData.move_in_date : formData.available_from}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
              />
            </div>

            {/* Room Features (for offering) */}
            {listingType === "offering" && (
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="is_furnished"
                    checked={formData.is_furnished}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <span>🛋️ Furnished</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="has_own_bathroom"
                    checked={formData.has_own_bathroom}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <span>🚿 Own Bathroom</span>
                </label>
              </div>
            )}

            {/* Preferences */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Preferences</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Gender</label>
                  <select
                    name="preferred_gender"
                    value={formData.preferred_gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  >
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="smoker_friendly"
                    checked={formData.smoker_friendly}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm">🚬 Smoker OK</span>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="pet_friendly"
                    checked={formData.pet_friendly}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm">🐾 Pets OK</span>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="couples_ok"
                    checked={formData.couples_ok}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm">💑 Couples OK</span>
                </label>
              </div>
            </div>

            {/* About Me */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">About You</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="my_age"
                    value={formData.my_age}
                    onChange={handleChange}
                    placeholder="25"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="my_gender"
                    value={formData.my_gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                  <input
                    type="text"
                    name="my_occupation"
                    value={formData.my_occupation}
                    onChange={handleChange}
                    placeholder="Software Developer"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                <textarea
                  name="about_me"
                  value={formData.about_me}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell potential roommates about yourself..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  ✓ Post Listing
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
