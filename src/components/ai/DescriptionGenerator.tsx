"use client";

import { useState } from "react";
import { SparklesIcon, PlusIcon, XMarkIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface DescriptionGeneratorProps {
  title: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  onDescriptionGenerated: (description: string) => void;
}

export default function DescriptionGenerator({
  title,
  propertyType,
  bedrooms,
  bathrooms,
  location,
  onDescriptionGenerated,
}: DescriptionGeneratorProps) {
  const [bulletPoints, setBulletPoints] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const addBulletPoint = () => {
    setBulletPoints([...bulletPoints, ""]);
  };

  const removeBulletPoint = (index: number) => {
    if (bulletPoints.length > 1) {
      setBulletPoints(bulletPoints.filter((_, i) => i !== index));
    }
  };

  const updateBulletPoint = (index: number, value: string) => {
    const updated = [...bulletPoints];
    updated[index] = value;
    setBulletPoints(updated);
  };

  const generateDescription = async () => {
    const validPoints = bulletPoints.filter((p) => p.trim());
    if (validPoints.length === 0) {
      setError("Add at least one feature");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          bulletPoints: validPoints,
          propertyType,
          bedrooms,
          bathrooms,
          location,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const data = await response.json();
      setGeneratedDescription(data.description);
      onDescriptionGenerated(data.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl border border-primary/20">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <SparklesIcon className="h-5 w-5" />
        AI Description Generator
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Property Features (bullet points)
        </label>
        {bulletPoints.map((point, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={point}
              onChange={(e) => updateBulletPoint(index, e.target.value)}
              placeholder={`Feature ${index + 1} (e.g., "Modern kitchen", "Large garden")`}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 
                       focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {bulletPoints.length > 1 && (
              <button
                type="button"
                onClick={() => removeBulletPoint(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addBulletPoint}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <PlusIcon className="h-4 w-4" /> Add feature
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={generateDescription}
        disabled={loading}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold
                 flex items-center justify-center gap-2 hover:bg-primary/90
                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5" />
            Generate Description
          </>
        )}
      </button>

      {generatedDescription && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Generated Description</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">{generatedDescription}</p>
        </div>
      )}
    </div>
  );
}
