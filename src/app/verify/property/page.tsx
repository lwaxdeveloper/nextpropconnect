'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Property {
  id: number;
  title: string;
  address: string;
  ownership_verified: boolean;
}

function PropertyVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>(propertyId || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [documents, setDocuments] = useState<{
    titleDeed: string | null;
    ratesAccount: string | null;
  }>({
    titleDeed: null,
    ratesAccount: null,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const res = await fetch('/api/properties?mine=true');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(type: 'titleDeed' | 'ratesAccount', file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setDocuments(prev => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedProperty) {
      setError('Please select a property');
      return;
    }

    if (!documents.titleDeed && !documents.ratesAccount) {
      setError('Please upload at least one ownership document');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'property',
          propertyId: parseInt(selectedProperty),
          documents: [
            documents.titleDeed && { type: 'title_deed', url: documents.titleDeed },
            documents.ratesAccount && { type: 'rates_account', url: documents.ratesAccount },
          ].filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      router.push('/verify?submitted=property');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const unverifiedProperties = properties.filter(p => !p.ownership_verified);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/verify" className="text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Back to Verification Centre
        </Link>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
              🏠
            </div>
            <div>
              <h1 className="text-xl font-bold">Property Ownership Verification</h1>
              <p className="text-sm text-muted-foreground">Prove you own the property you're listing</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ) : unverifiedProperties.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-semibold mb-2">All properties verified!</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any properties that need verification.
              </p>
              <Link href="/properties/new" className="text-primary hover:underline">
                List a new property
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Property *</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Choose a property...</option>
                  {unverifiedProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Deed */}
              <div>
                <label className="block text-sm font-medium mb-2">Title Deed</label>
                <DocumentUpload
                  label="Title Deed"
                  value={documents.titleDeed}
                  onChange={(file) => handleFileUpload('titleDeed', file)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a copy of your property's title deed
                </p>
              </div>

              {/* Rates Account */}
              <div>
                <label className="block text-sm font-medium mb-2">Municipal Rates Account</label>
                <DocumentUpload
                  label="Rates Account"
                  value={documents.ratesAccount}
                  onChange={(file) => handleFileUpload('ratesAccount', file)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recent rates statement showing your name and property address
                </p>
              </div>

              <button
                type="submit"
                disabled={!selectedProperty || (!documents.titleDeed && !documents.ratesAccount) || submitting}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">🔒 Why verify ownership?</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• "Verified Owner" badge on your listing</li>
              <li>• Builds trust with potential buyers</li>
              <li>• Reduces fraud concerns</li>
              <li>• Higher visibility in search</li>
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

export default function PropertyVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <PropertyVerificationContent />
    </Suspense>
  );
}
