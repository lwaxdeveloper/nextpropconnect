"use client";

import { useState } from "react";
import { FileText, Upload, Check, X } from "lucide-react";

interface Props {
  propertyId: number;
  currentMandateUrl?: string | null;
  mandateSignedAt?: string | null;
  mandateExpiresAt?: string | null;
  onUpdate?: () => void;
}

export default function MandateUpload({
  propertyId,
  currentMandateUrl,
  mandateSignedAt,
  mandateExpiresAt,
  onUpdate,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [expiryDate, setExpiryDate] = useState(mandateExpiresAt || "");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      setError("Please upload a PDF or image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("propertyId", propertyId.toString());
      formData.append("type", "mandate");
      if (expiryDate) {
        formData.append("expiresAt", expiryDate);
      }

      const res = await fetch("/api/properties/mandate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const isExpired = mandateExpiresAt && new Date(mandateExpiresAt) < new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-dark">Mandate Document</h3>
      </div>

      {currentMandateUrl ? (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 p-3 rounded-lg ${isExpired ? "bg-red-50" : "bg-green-50"}`}>
            {isExpired ? (
              <X className="w-5 h-5 text-red-500" />
            ) : (
              <Check className="w-5 h-5 text-green-500" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${isExpired ? "text-red-700" : "text-green-700"}`}>
                {isExpired ? "Mandate Expired" : "Mandate Uploaded"}
              </p>
              {mandateSignedAt && (
                <p className="text-xs text-gray-500">
                  Signed: {new Date(mandateSignedAt).toLocaleDateString()}
                </p>
              )}
              {mandateExpiresAt && (
                <p className={`text-xs ${isExpired ? "text-red-500" : "text-gray-500"}`}>
                  Expires: {new Date(mandateExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <a
              href={currentMandateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View
            </a>
          </div>

          <label className="block">
            <span className="text-xs text-gray-500">Upload new mandate</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              Upload signed mandate document
            </p>
            
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Mandate Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border rounded-lg px-3 py-2 text-sm w-full max-w-[200px]"
              />
            </div>

            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${
                uploading
                  ? "bg-gray-100 text-gray-400"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}>
                {uploading ? "Uploading..." : "Choose File"}
              </span>
            </label>
          </div>

          <p className="text-xs text-gray-400 text-center">
            PDF or image, max 5MB
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
