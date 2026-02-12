'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentVerificationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    eaabNumber: '',
    fidelityFundNumber: '',
    agencyName: '',
  });

  const [documents, setDocuments] = useState<{
    eaabCert: string | null;
    fidelityCert: string | null;
    idDocument: string | null;
  }>({
    eaabCert: null,
    fidelityCert: null,
    idDocument: null,
  });

  async function handleFileUpload(type: keyof typeof documents, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setDocuments(prev => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!documents.eaabCert) {
      setError('Please upload your EAAB certificate');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'agent',
          documents: [
            { type: 'eaab_cert', url: documents.eaabCert },
            documents.fidelityCert && { type: 'fidelity_cert', url: documents.fidelityCert },
            documents.idDocument && { type: 'id_document', url: documents.idDocument },
          ].filter(Boolean),
          metadata: {
            eaabNumber: formData.eaabNumber,
            fidelityFundNumber: formData.fidelityFundNumber,
            agencyName: formData.agencyName,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      router.push('/verify?submitted=agent');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/verify" className="text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Back to Verification Centre
        </Link>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <h1 className="text-xl font-bold">Agent Verification</h1>
              <p className="text-sm text-muted-foreground">Verify your estate agent credentials</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* EAAB Details */}
            <div>
              <label className="block text-sm font-medium mb-2">EAAB Registration Number</label>
              <input
                type="text"
                value={formData.eaabNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, eaabNumber: e.target.value }))}
                placeholder="e.g., P12345678"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Estate Agency Affairs Board registration number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">EAAB/PPRA Certificate *</label>
              <DocumentUpload
                label="EAAB Certificate"
                value={documents.eaabCert}
                onChange={(file) => handleFileUpload('eaabCert', file)}
              />
            </div>

            {/* Fidelity Fund */}
            <div>
              <label className="block text-sm font-medium mb-2">Fidelity Fund Certificate Number</label>
              <input
                type="text"
                value={formData.fidelityFundNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, fidelityFundNumber: e.target.value }))}
                placeholder="Optional"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fidelity Fund Certificate (Optional)</label>
              <DocumentUpload
                label="Fidelity Certificate"
                value={documents.fidelityCert}
                onChange={(file) => handleFileUpload('fidelityCert', file)}
              />
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Agency/Firm Name</label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                placeholder="e.g., ABC Properties"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* ID Document */}
            <div>
              <label className="block text-sm font-medium mb-2">ID Document (Optional)</label>
              <DocumentUpload
                label="ID Document"
                value={documents.idDocument}
                onChange={(file) => handleFileUpload('idDocument', file)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload if not already identity verified
              </p>
            </div>

            <button
              type="submit"
              disabled={!documents.eaabCert || submitting}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">✓ Benefits of Agent Verification</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• "Verified Agent" badge on your profile</li>
              <li>• Higher ranking in search results</li>
              <li>• Increased trust from buyers & sellers</li>
              <li>• Access to premium agent features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentUpload({ label, value, onChange }: {
  label: string;
  value: string | null;
  onChange: (file: File) => void;
}) {
  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center">
      {value ? (
        <div className="space-y-2">
          <img src={value} alt={label} className="max-h-32 mx-auto rounded-lg" />
          <button
            type="button"
            onClick={() => document.getElementById(`upload-${label}`)?.click()}
            className="text-sm text-primary hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-2xl">📄</div>
          <button
            type="button"
            onClick={() => document.getElementById(`upload-${label}`)?.click()}
            className="px-3 py-1 bg-muted text-sm rounded hover:bg-muted/80"
          >
            Upload
          </button>
        </div>
      )}
      <input
        id={`upload-${label}`}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
    </div>
  );
}
