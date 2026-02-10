"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "./PriceDisplay";
import StatusBadge from "./StatusBadge";

const SA_PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

const PROPERTY_TYPES = [
  "House",
  "Apartment",
  "Townhouse",
  "Farm",
  "Land",
  "Commercial",
];

const STEPS = [
  "Basics",
  "Location",
  "Details",
  "Features",
  "Description",
  "Photos",
  "Review",
];

const PHOTO_CATEGORIES = [
  { value: "exterior", label: "🏠 Exterior", desc: "Front view, street" },
  { value: "living", label: "🛋️ Living Areas", desc: "Lounge, dining" },
  { value: "kitchen", label: "🍳 Kitchen", desc: "Kitchen, pantry" },
  { value: "bedroom", label: "🛏️ Bedrooms", desc: "Main & other beds" },
  { value: "bathroom", label: "🚿 Bathrooms", desc: "All bathrooms" },
  { value: "garden", label: "🌳 Garden", desc: "Outdoor, pool" },
  { value: "garage", label: "🚗 Garage", desc: "Parking, storage" },
  { value: "other", label: "📋 Other", desc: "Floorplan, etc" },
];

export interface ListingFormData {
  title: string;
  listing_type: string;
  property_type: string;
  street_address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  garages: string;
  parking_spaces: string;
  floor_size: string;
  erf_size: string;
  year_built: string;
  has_pool: boolean;
  has_garden: boolean;
  has_security: boolean;
  has_pet_friendly: boolean;
  is_furnished: boolean;
  description: string;
  status: string;
}

const defaultData: ListingFormData = {
  title: "",
  listing_type: "sale",
  property_type: "house",
  street_address: "",
  suburb: "",
  city: "",
  province: "Gauteng",
  postal_code: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  garages: "",
  parking_spaces: "",
  floor_size: "",
  erf_size: "",
  year_built: "",
  has_pool: false,
  has_garden: false,
  has_security: false,
  has_pet_friendly: false,
  is_furnished: false,
  description: "",
  status: "draft",
};

export default function ListingForm({
  initialData,
  propertyId,
  existingImages,
}: {
  initialData?: Partial<ListingFormData>;
  propertyId?: number;
  existingImages?: { id: number; url: string; alt_text: string | null; category?: string }[];
}) {
  const router = useRouter();
  const isEdit = !!propertyId;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingFormData>({
    ...defaultData,
    ...initialData,
  });
  const [photos, setPhotos] = useState<{ file: File; category: string }[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<{ src: string; category: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("exterior");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof ListingFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxTotal = 20 - (existingImages?.length || 0) - photos.length;
    const allowed = files.slice(0, Math.max(0, maxTotal));
    
    allowed.forEach((f) => {
      setPhotos((prev) => [...prev, { file: f, category: selectedCategory }]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, { src: ev.target?.result as string, category: selectedCategory }]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhotoCategory = (index: number, category: string) => {
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, category } : p));
    setPhotoPreviews((prev) => prev.map((p, i) => i === index ? { ...p, category } : p));
  };

  const save = async (publish: boolean) => {
    setSaving(true);
    setError("");

    try {
      const body = {
        ...form,
        status: publish ? "active" : "draft",
        price: parseFloat(form.price) || 0,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        garages: form.garages ? parseInt(form.garages) : null,
        parking_spaces: form.parking_spaces ? parseInt(form.parking_spaces) : null,
        floor_size: form.floor_size ? parseFloat(form.floor_size) : null,
        erf_size: form.erf_size ? parseFloat(form.erf_size) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
      };

      const url = isEdit ? `/api/properties/${propertyId}` : "/api/properties";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save listing");
      }

      const data = await res.json();
      const pid = isEdit ? propertyId : data.id;

      // Upload photos
      if (photos.length > 0) {
        setUploading(true);
        for (let i = 0; i < photos.length; i++) {
          const fd = new FormData();
          fd.append("file", photos[i].file);
          fd.append("property_id", String(pid));
          fd.append("sort_order", String((existingImages?.length || 0) + i));
          fd.append("category", photos[i].category);

          await fetch("/api/upload", {
            method: "POST",
            body: fd,
          });
        }
        setUploading(false);
      }

      router.push(`/properties/${pid}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = () => {
    switch (step) {
      case 0:
        return form.title && form.listing_type && form.property_type;
      case 1:
        return form.city && form.province;
      case 2:
        return form.price && parseFloat(form.price) > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1 text-xs font-medium transition ${
                i === step
                  ? "text-primary"
                  : i < step
                  ? "text-gray-500 hover:text-dark cursor-pointer"
                  : "text-gray-300"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step
                    ? "bg-primary text-white"
                    : i < step
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
          ))}
        </div>
        <div className="h-1 bg-gray-100 rounded-full">
          <div
            className="h-1 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Basics */}
      {step === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">
            What are you listing?
          </h2>

          <div>
            <label className="text-sm font-semibold text-dark block mb-2">
              Listing Type
            </label>
            <div className="flex gap-3">
              {[
                { value: "sale", label: "🏷️ For Sale" },
                { value: "rent", label: "🔑 To Rent" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("listing_type", opt.value)}
                  className={`flex-1 p-4 rounded-xl border-2 text-sm font-medium transition ${
                    form.listing_type === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-dark block mb-2">
              Property Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => set("property_type", pt.toLowerCase())}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition ${
                    form.property_type === pt.toLowerCase()
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-dark block mb-2">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Spacious 3-bed family home in Boksburg"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={255}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">Where is it?</h2>

          <div>
            <label className="text-sm font-semibold text-dark block mb-2">
              Street Address <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 15 Main Road"
              value={form.street_address}
              onChange={(e) => set("street_address", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Suburb
              </label>
              <input
                type="text"
                placeholder="e.g. Sandton"
                value={form.suburb}
                onChange={(e) => set("suburb", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                City *
              </label>
              <input
                type="text"
                placeholder="e.g. Johannesburg"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Province *
              </label>
              <select
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Postal Code
              </label>
              <input
                type="text"
                placeholder="e.g. 2090"
                value={form.postal_code}
                onChange={(e) => set("postal_code", e.target.value)}
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">The details</h2>

          <div>
            <label className="text-sm font-semibold text-dark block mb-2">
              Price (ZAR) *
            </label>
            <input
              type="number"
              placeholder={form.listing_type === "rent" ? "e.g. 12000" : "e.g. 1500000"}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            {form.price && parseFloat(form.price) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {formatPrice(parseFloat(form.price))}
                {form.listing_type === "rent" ? " /month" : ""}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Garages
              </label>
              <input
                type="number"
                min="0"
                value={form.garages}
                onChange={(e) => set("garages", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Parking
              </label>
              <input
                type="number"
                min="0"
                value={form.parking_spaces}
                onChange={(e) => set("parking_spaces", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Floor Size (m²)
              </label>
              <input
                type="number"
                min="0"
                value={form.floor_size}
                onChange={(e) => set("floor_size", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Erf Size (m²)
              </label>
              <input
                type="number"
                min="0"
                value={form.erf_size}
                onChange={(e) => set("erf_size", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Year Built
              </label>
              <input
                type="number"
                min="1900"
                max="2026"
                value={form.year_built}
                onChange={(e) => set("year_built", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Features */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">
            What features does it have?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "has_pool" as const, label: "🏊 Swimming Pool" },
              { key: "has_garden" as const, label: "🌳 Garden" },
              { key: "has_security" as const, label: "🔒 Security" },
              { key: "has_pet_friendly" as const, label: "🐾 Pet Friendly" },
              { key: "is_furnished" as const, label: "🛋️ Furnished" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => set(key, !form[key])}
                className={`p-4 rounded-xl border-2 text-sm font-medium text-left transition ${
                  form[key]
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Description */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">
            Describe the property
          </h2>
          <p className="text-sm text-gray-500">
            Write like you&apos;re telling a friend about it. What makes it special?
            What would you want to know if you were buying?
          </p>
          <div>
            <textarea
              rows={10}
              placeholder="e.g. This is a stunning family home with open-plan living, a modern kitchen, and a lapa overlooking the pool. Walking distance to Boksburg Lake..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {form.description.length} / 5,000
            </p>
          </div>
        </div>
      )}

      {/* Step 6: Photos */}
      {step === 5 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">Add photos</h2>
          <p className="text-sm text-gray-500">
            Good photos sell properties. Upload up to 20 images (max 5MB each).
            Organize them by category for a professional look.
          </p>

          {/* Existing images grouped by category */}
          {existingImages && existingImages.length > 0 && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-dark block">
                Current photos
              </label>
              {PHOTO_CATEGORIES.filter(cat => 
                existingImages.some(img => (img.category || 'other') === cat.value)
              ).map(cat => (
                <div key={cat.value} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{cat.label}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {existingImages.filter(img => (img.category || 'other') === cat.value).map((img) => (
                      <div
                        key={img.id}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                      >
                        <img
                          src={img.url}
                          alt={img.alt_text || ""}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category selector */}
          <div>
            <label className="text-sm font-semibold text-dark block mb-2">
              Select category, then upload photos
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {PHOTO_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    selectedCategory === cat.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-sm font-medium ${selectedCategory === cat.value ? "text-primary" : "text-gray-700"}`}>
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{cat.desc}</p>
                </button>
              ))}
            </div>

            {/* Upload button */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotos}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-primary hover:bg-primary/5 transition"
            >
              <div className="text-2xl mb-1">📸</div>
              <p className="text-sm font-medium text-gray-600">
                Upload {PHOTO_CATEGORIES.find(c => c.value === selectedCategory)?.label.split(" ")[1]} photos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {20 - (existingImages?.length || 0) - photos.length} slots remaining
              </p>
            </button>
          </div>

          {/* New photos grouped by category */}
          {photoPreviews.length > 0 && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-dark block">
                New photos to upload
              </label>
              {PHOTO_CATEGORIES.filter(cat => 
                photoPreviews.some(p => p.category === cat.value)
              ).map(cat => (
                <div key={cat.value} className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">{cat.label}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {photoPreviews.map((preview, i) => 
                      preview.category === cat.value && (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <img
                            src={preview.src}
                            alt={`Upload ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                          >
                            ×
                          </button>
                          <select
                            value={preview.category}
                            onChange={(e) => updatePhotoCategory(i, e.target.value)}
                            className="absolute bottom-1 left-1 right-1 text-[9px] bg-white/90 rounded px-1 py-0.5"
                          >
                            {PHOTO_CATEGORIES.map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 7: Review */}
      {step === 6 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark">Review your listing</h2>

          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge
                status="active"
                listingType={form.listing_type}
                size="md"
              />
              <span className="text-xs text-gray-400 capitalize">
                {form.property_type}
              </span>
            </div>

            <h3 className="text-lg font-bold text-dark">{form.title || "Untitled"}</h3>

            <div className="text-2xl font-bold text-dark">
              {form.price ? formatPrice(parseFloat(form.price)) : "Price not set"}
              {form.listing_type === "rent" && (
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  /month
                </span>
              )}
            </div>

            <div className="flex gap-4 text-sm text-gray-600">
              {form.bedrooms && <span>🛏️ {form.bedrooms} bed</span>}
              {form.bathrooms && <span>🚿 {form.bathrooms} bath</span>}
              {form.garages && <span>🚗 {form.garages} garage</span>}
              {form.floor_size && <span>📐 {form.floor_size}m²</span>}
            </div>

            <p className="text-sm text-gray-500">
              📍{" "}
              {[form.suburb, form.city, form.province]
                .filter(Boolean)
                .join(", ")}
            </p>

            {form.description && (
              <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
                {form.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {form.has_pool && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">🏊 Pool</span>
              )}
              {form.has_garden && (
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">🌳 Garden</span>
              )}
              {form.has_security && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">🔒 Security</span>
              )}
              {form.has_pet_friendly && (
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">🐾 Pet Friendly</span>
              )}
              {form.is_furnished && (
                <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full">🛋️ Furnished</span>
              )}
            </div>

            {photoPreviews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {photoPreviews.map((preview, i) => (
                  <img
                    key={i}
                    src={preview.src}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {isEdit && (
            <div>
              <label className="text-sm font-semibold text-dark block mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {["active", "draft", "sold", "rented"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                      form.status === s
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
        <div>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-dark transition"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {step < 6 && (
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-gray-500 hover:text-dark border border-gray-200 rounded-xl transition"
            >
              Save Draft
            </button>
          )}
          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving || uploading}
              className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
            >
              {saving
                ? uploading
                  ? "Uploading photos..."
                  : "Saving..."
                : isEdit
                ? "Update Listing"
                : "🚀 Publish Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
