'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface KYCData {
  // Personal Info
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;
  
  // Agent Info
  eaabNumber: string;
  ffcNumber: string;
  
  // Documents
  idFront: string | null;
  idBack: string | null;
  selfie: string | null;
  proofOfAddress: string | null;
  eaabCertificate: string | null;
}

const INITIAL_DATA: KYCData = {
  fullName: '',
  idNumber: '',
  dateOfBirth: '',
  nationality: 'South African',
  phone: '',
  eaabNumber: '',
  ffcNumber: '',
  idFront: null,
  idBack: null,
  selfie: null,
  proofOfAddress: null,
  eaabCertificate: null,
};

export default function IdentityVerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<KYCData>(INITIAL_DATA);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing verification status
    fetch('/api/verify/status')
      .then(res => res.json())
      .then(result => {
        if (result.identity) {
          setExistingStatus(result.identity.status);
          if (result.identity.data) {
            setData(prev => ({ ...prev, ...result.identity.data }));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function validateIdNumber(id: string): boolean {
    // Basic SA ID validation (13 digits)
    if (!/^\d{13}$/.test(id)) return false;
    // Luhn algorithm check
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let digit = parseInt(id[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  function extractDOBFromID(id: string): string {
    if (id.length < 6) return '';
    const yy = id.substring(0, 2);
    const mm = id.substring(2, 4);
    const dd = id.substring(4, 6);
    const year = parseInt(yy) > 30 ? `19${yy}` : `20${yy}`;
    return `${year}-${mm}-${dd}`;
  }

  function handleIdChange(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 13);
    setData(prev => ({
      ...prev,
      idNumber: cleaned,
      dateOfBirth: cleaned.length >= 6 ? extractDOBFromID(cleaned) : prev.dateOfBirth,
    }));
  }

  async function handleFileUpload(field: keyof KYCData, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'kyc');

    try {
      const res = await fetch('/api/upload/kyc', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const { url } = await res.json();
      setData(prev => ({ ...prev, [field]: url }));
    } catch (err) {
      // Fallback to data URL for demo
      const reader = new FileReader();
      reader.onload = () => {
        setData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit() {
    // Validation
    if (!data.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!validateIdNumber(data.idNumber)) {
      setError('Please enter a valid 13-digit SA ID number');
      return;
    }
    if (!data.idFront) {
      setError('Please upload the front of your ID document');
      return;
    }
    if (!data.selfie) {
      setError('Please upload a selfie with your ID');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/verify/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Submission failed');
      }

      router.push('/verify?submitted=identity');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (existingStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Already Verified!</h1>
            <p className="text-gray-500 mb-6">Your identity has been verified. You have the blue tick badge.</p>
            <Link href="/agent/profile" className="text-primary hover:underline">
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (existingStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-yellow-600 mb-2">Verification Pending</h1>
            <p className="text-gray-500 mb-6">Your documents are being reviewed. This usually takes 24-48 hours.</p>
            <Link href="/agent/profile" className="text-primary hover:underline">
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const STEPS = [
    { num: 1, label: 'Personal Info' },
    { num: 2, label: 'ID Document' },
    { num: 3, label: 'Verification' },
    { num: 4, label: 'Professional' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/verify" className="text-gray-500 hover:text-gray-700 mb-4 inline-block text-sm">
          ← Back to Verification Centre
        </Link>

        <div className="bg-white border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                🪪
              </div>
              <div>
                <h1 className="text-xl font-bold">Identity Verification (KYC)</h1>
                <p className="text-sm opacity-90">Complete verification to earn your trust badge</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step > s.num ? 'bg-green-500 text-white' :
                      step === s.num ? 'bg-primary text-white' : 
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 hidden md:block">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 md:w-16 h-1 mx-1 ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <p className="text-sm text-gray-500">Enter your details exactly as they appear on your ID document.</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={data.fullName}
                    onChange={(e) => setData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="As it appears on your ID"
                    className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SA ID Number *</label>
                  <input
                    type="text"
                    value={data.idNumber}
                    onChange={(e) => handleIdChange(e.target.value)}
                    placeholder="13-digit ID number"
                    maxLength={13}
                    className={`w-full px-4 py-3 border rounded-lg focus:border-primary outline-none font-mono ${
                      data.idNumber.length === 13 && !validateIdNumber(data.idNumber) ? 'border-red-500' : ''
                    }`}
                  />
                  {data.idNumber.length === 13 && !validateIdNumber(data.idNumber) && (
                    <p className="text-red-500 text-xs mt-1">Invalid ID number</p>
                  )}
                  {data.idNumber.length === 13 && validateIdNumber(data.idNumber) && (
                    <p className="text-green-500 text-xs mt-1">✓ Valid ID number</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={data.dateOfBirth}
                      onChange={(e) => setData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <select
                      value={data.nationality}
                      onChange={(e) => setData(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none"
                    >
                      <option value="South African">South African</option>
                      <option value="Other">Other (Passport holder)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+27 XX XXX XXXX"
                    className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      if (!data.fullName || !validateIdNumber(data.idNumber)) {
                        setError('Please fill in all required fields correctly');
                        return;
                      }
                      setError('');
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: ID Document Upload */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Upload ID Document</h2>
                <p className="text-sm text-gray-500">
                  Upload clear photos of your {data.nationality === 'South African' ? 'SA ID card or Smart ID' : 'passport'}.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <DocumentUpload
                    label={data.nationality === 'South African' ? 'ID Front' : 'Passport Photo Page'}
                    required
                    value={data.idFront}
                    onChange={(file) => handleFileUpload('idFront', file)}
                  />
                  <DocumentUpload
                    label={data.nationality === 'South African' ? 'ID Back' : 'Passport Data Page'}
                    value={data.idBack}
                    onChange={(file) => handleFileUpload('idBack', file)}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📸 Tips for good photos:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure all text is clearly visible</li>
                    <li>• Avoid glare and shadows</li>
                    <li>• Place document on a flat, dark surface</li>
                    <li>• Photo should not be blurry</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!data.idFront) {
                        setError('Please upload the front of your ID');
                        return;
                      }
                      setError('');
                      setStep(3);
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Selfie Verification */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Selfie Verification</h2>
                <p className="text-sm text-gray-500">
                  Take a photo of yourself holding your ID next to your face. This confirms you're the document owner.
                </p>

                <DocumentUpload
                  label="Selfie with ID"
                  required
                  value={data.selfie}
                  onChange={(file) => handleFileUpload('selfie', file)}
                  large
                />

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Requirements:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Your face must be clearly visible</li>
                    <li>• Hold your ID next to your face</li>
                    <li>• Both your face and ID must be in the photo</li>
                    <li>• ID details must be readable</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!data.selfie) {
                        setError('Please upload a selfie with your ID');
                        return;
                      }
                      setError('');
                      setStep(4);
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Professional Details */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Professional Credentials</h2>
                <p className="text-sm text-gray-500">
                  Add your estate agent registration details for the verified agent badge.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EAAB Registration Number</label>
                    <input
                      type="text"
                      value={data.eaabNumber}
                      onChange={(e) => setData(prev => ({ ...prev, eaabNumber: e.target.value }))}
                      placeholder="e.g. EAAB12345"
                      className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FFC Number</label>
                    <input
                      type="text"
                      value={data.ffcNumber}
                      onChange={(e) => setData(prev => ({ ...prev, ffcNumber: e.target.value }))}
                      placeholder="e.g. FFC2026/001"
                      className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <DocumentUpload
                  label="EAAB Certificate (Optional)"
                  value={data.eaabCertificate}
                  onChange={(file) => handleFileUpload('eaabCertificate', file)}
                />

                <DocumentUpload
                  label="Proof of Address (Optional)"
                  subtitle="Utility bill or bank statement not older than 3 months"
                  value={data.proofOfAddress}
                  onChange={(file) => handleFileUpload('proofOfAddress', file)}
                />

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Name:</span> {data.fullName}</p>
                    <p><span className="text-gray-500">ID Number:</span> {data.idNumber.slice(0, 6)}******{data.idNumber.slice(-2)}</p>
                    <p><span className="text-gray-500">Documents:</span> {[data.idFront && 'ID Front', data.idBack && 'ID Back', data.selfie && 'Selfie'].filter(Boolean).join(', ')}</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : '✓ Submit for Verification'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>🔒</span>
              <span>Your data is encrypted and POPIA compliant. We never share your personal information.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentUpload({ label, subtitle, value, onChange, required, large }: {
  label: string;
  subtitle?: string;
  value: string | null;
  onChange: (file: File) => void;
  required?: boolean;
  large?: boolean;
}) {
  const id = `upload-${label.replace(/\s+/g, '-')}`;
  
  return (
    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition hover:border-primary ${large ? 'py-8' : ''}`}>
      {value ? (
        <div className="space-y-2">
          <img src={value} alt={label} className={`${large ? 'max-h-64' : 'max-h-32'} mx-auto rounded-lg object-contain`} />
          <button
            type="button"
            onClick={() => document.getElementById(id)?.click()}
            className="text-sm text-primary hover:underline"
          >
            Change image
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className={`${large ? 'text-5xl' : 'text-3xl'}`}>📷</div>
          <div>
            <span className="text-gray-700">{label}</span>
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          <button
            type="button"
            onClick={() => document.getElementById(id)?.click()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
          >
            Upload Photo
          </button>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
    </div>
  );
}
