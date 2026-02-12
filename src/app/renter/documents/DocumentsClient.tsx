"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Document {
  id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  uploaded_at: string;
}

interface Props {
  tenant: {
    id: number;
    lease_document_url?: string;
    property_title: string;
  };
  initialDocuments: Document[];
}

const requiredDocuments = [
  { key: "id_document", label: "ID Document / Passport", description: "Certified copy of your ID", icon: "🪪" },
  { key: "proof_of_income", label: "Proof of Income", description: "3 months payslips or bank statements", icon: "💰" },
  { key: "proof_of_residence", label: "Proof of Residence", description: "Utility bill or bank statement", icon: "📍" },
  { key: "employment_letter", label: "Employment Letter", description: "Confirmation of employment", icon: "💼" },
];

export default function DocumentsClient({ tenant, initialDocuments }: Props) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  const setFileInputRef = (key: string) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[key] = el;
  };

  const getDocumentByType = (type: string) => {
    return documents.find((d) => d.document_type === type);
  };

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    try {
      // Simulate progress (real progress would need XMLHttpRequest or fetch with streams)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const res = await fetch("/api/renter/documents", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      
      // Update documents list
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.document_type !== docType);
        return [...filtered, data.document];
      });

      // Clear file input
      if (fileInputRefs.current[docType]) {
        fileInputRefs.current[docType]!.value = "";
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setTimeout(() => {
        setUploading(null);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(docType, file);
    }
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">📄 Documents</h1>
        <p className="text-gray-500 text-sm mb-6">
          Manage your rental documents and FICA requirements
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 text-sm underline mt-1">
              Dismiss
            </button>
          </div>
        )}

        {/* Lease Agreement */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">📋</span>
            Lease Agreement
          </h2>
          {tenant.lease_document_url ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📄</span>
                <div>
                  <p className="font-medium">Signed Lease Agreement</p>
                  <p className="text-sm text-gray-500">{tenant.property_title}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={tenant.lease_document_url}
                  target="_blank"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                >
                  View PDF
                </a>
                <a
                  href={tenant.lease_document_url}
                  download
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-yellow-50 rounded-xl">
              <p className="text-yellow-700 font-medium">Lease document not yet uploaded</p>
              <p className="text-sm text-yellow-600 mt-1">Your landlord will upload the signed lease</p>
            </div>
          )}
        </div>

        {/* FICA Documents */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">📑</span>
            FICA Documents
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Required documents for tenant verification (FICA compliance)
          </p>

          <div className="space-y-3">
            {requiredDocuments.map((doc) => {
              const uploaded = getDocumentByType(doc.key);
              const isUploading = uploading === doc.key;

              return (
                <div
                  key={doc.key}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${
                    uploaded
                      ? "bg-green-50 border-green-200"
                      : isUploading
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <p className="font-medium">{doc.label}</p>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                    </div>
                  </div>

                  {isUploading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                  ) : uploaded ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          uploaded.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : uploaded.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {uploaded.status === "verified" ? "✓ Verified" : uploaded.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                      </span>
                      <a
                        href={uploaded.file_url}
                        target="_blank"
                        className="text-gray-500 text-sm hover:underline"
                      >
                        View
                      </a>
                      <label className="text-primary text-sm hover:underline cursor-pointer">
                        Replace
                        <input
                          ref={setFileInputRef(doc.key)}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => handleFileChange(doc.key, e)}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition cursor-pointer">
                      Upload
                      <input
                        ref={setFileInputRef(doc.key)}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => handleFileChange(doc.key, e)}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-xl space-y-2">
            <p className="text-blue-700 text-sm">
              <strong>Note:</strong> Documents must be certified copies and less than 3 months old.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Who verifies?</strong> Your landlord or managing agent will review and verify your documents. You'll be notified once they're approved.
            </p>
          </div>
        </div>

        {/* Payment Receipts */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">🧾</span>
            Payment Receipts
          </h2>
          <p className="text-gray-400 text-center py-8">
            Payment receipts will appear here after you make rent payments
          </p>
          <Link href="/renter/payments" className="block text-center text-primary hover:underline text-sm">
            View payment history →
          </Link>
        </div>
      </div>
    </div>
  );
}
