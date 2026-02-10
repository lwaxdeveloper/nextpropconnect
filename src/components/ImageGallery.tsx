"use client";

import { useState, useMemo } from "react";

interface ImageData {
  id: number;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  category?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  exterior: "🏠 Exterior",
  living: "🛋️ Living",
  kitchen: "🍳 Kitchen",
  bedroom: "🛏️ Bedrooms",
  bathroom: "🚿 Bathrooms",
  garden: "🌳 Garden",
  garage: "🚗 Garage",
  other: "📋 Other",
};

export default function ImageGallery({ images }: { images: ImageData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Get unique categories from images
  const categories = useMemo(() => {
    const cats = [...new Set(images.map(img => img.category || "other"))];
    // Sort by predefined order
    const order = ["exterior", "living", "kitchen", "bedroom", "bathroom", "garden", "garage", "other"];
    return cats.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [images]);

  // Filter images by active category
  const filteredImages = useMemo(() => {
    if (!activeCategory) return images;
    return images.filter(img => (img.category || "other") === activeCategory);
  }, [images, activeCategory]);

  // Reset active index when category changes
  const handleCategoryChange = (cat: string | null) => {
    setActiveCategory(cat);
    setActiveIndex(0);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-20 h-20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No photos yet</p>
        </div>
      </div>
    );
  }

  const currentImage = filteredImages[activeIndex] || filteredImages[0];
  const hasCategories = categories.length > 1;

  return (
    <>
      {/* Category Tabs */}
      {hasCategories && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeCategory === null
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📷 All ({images.length})
          </button>
          {categories.map((cat) => {
            const count = images.filter(img => (img.category || "other") === cat).length;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CATEGORY_LABELS[cat] || cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image */}
      <div
        className="relative aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setLightboxOpen(true)}
      >
        {currentImage && (
          <img
            src={currentImage.url}
            alt={currentImage.alt_text || "Property image"}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
          {activeIndex + 1} / {filteredImages.length}
          {activeCategory && <span className="ml-1">• {CATEGORY_LABELS[activeCategory]}</span>}
        </div>

        {/* Nav arrows */}
        {filteredImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) => (i === 0 ? filteredImages.length - 1 : i - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) => (i === filteredImages.length - 1 ? 0 : i + 1));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {filteredImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {filteredImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === activeIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt={img.alt_text || `Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && currentImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Category tabs in lightbox */}
          {hasCategories && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  activeCategory === null
                    ? "bg-white text-black"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    activeCategory === cat
                      ? "bg-white text-black"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {CATEGORY_LABELS[cat]?.split(" ")[0] || cat}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() =>
              setActiveIndex((i) => (i === 0 ? filteredImages.length - 1 : i - 1))
            }
            className="absolute left-4 text-white/80 hover:text-white p-2"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            src={filteredImages[activeIndex]?.url || currentImage.url}
            alt={filteredImages[activeIndex]?.alt_text || "Property image"}
            className="max-w-[90vw] max-h-[85vh] object-contain"
          />

          <button
            onClick={() =>
              setActiveIndex((i) => (i === filteredImages.length - 1 ? 0 : i + 1))
            }
            className="absolute right-4 text-white/80 hover:text-white p-2"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-6 text-white/60 text-sm">
            {activeIndex + 1} / {filteredImages.length}
            {activeCategory && <span className="ml-2">• {CATEGORY_LABELS[activeCategory]}</span>}
          </div>
        </div>
      )}
    </>
  );
}
