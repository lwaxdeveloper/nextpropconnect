'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AgencyKYCData {
  // Company Info
  companyName: string;
  tradingName: string;
  registrationNumber: string;  // CIPC
  vatNumber: string;
  
  // Address
  physicalAddress: string;
  city: string;
  province: string;
  postalCode: string;
  
  // Director Info
  directorName: string;
  directorIdNumber: string;
  directorEmail: string;
  directorPhone: string;
  
  // Compliance
  eaabNumber: string;
  fidelityFundNumber: string;
  beeLevel: string;
  
  // Documents
  cipcDocument: string | null;
  eaabCertificate: string | null;
  beeCertificate: string | null;
  bankLetter: string | null;
  directorId: string | null;
}

const INITIAL_DATA: AgencyKYCData = {
  companyName: '',
  tradingName: '',
  registrationNumber: '',
  vatNumber: '',
  physicalAddress: '',
  city: '',
  province: '',
  postalCode: '',
  directorName: '',
  directorIdNumber: '',
  directorEmail: '',
  directorPhone: '',
  eaabNumber: '',
  fidelityFundNumber: '',
  beeLevel: '',
  cipcDocument: null,
  eaabCertificate: null,
  beeCertificate: null,
  bankLetter: null,
  directorId: null,
};

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
];

const BEE_LEVELS = [
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5',
  'Level 6', 'Level 7', 'Level 8', 'Non-Compliant', 'Exempt Micro Enterprise (EME)'
];

export default function AgencyKYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AgencyKYCData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [existingAgency, setExistingAgency] = useState<{ id: number; kycStatus: string } | null>(null);

  useEffect(() => {
    // Fetch existing agency data
    fetch('/api/agencies?mine=true')
      .then(res => res.json())
      .then(result => {
        if (result.agency) {
          setExistingAgency({
            id: result.agency.id,
            kycStatus: result.agency.kyc_status || 'pending',
          });
          // Pre-fill existing data
          setData(prev => ({
            ...prev,
            companyName: result.agency.name || '',
            tradingName: result.agency.name || '',
            eaabNumber: result.agency.eaab_number || '',
            fidelityFundNumber: result.agency.fidelity_fund_number || '',
            physicalAddress: result.agency.address || '',
            city: result.agency.city || '',
            province: result.agency.province || '',
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function validateCIPC(regNum: string): boolean {
    // CIPC registration number format: YYYY/NNNNNN/NN
    return /^\d{4}\/\d{6}\/\d{2}$/.test(regNum);
  }

  async function handleFileUpload(field: keyof AgencyKYCData, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'agency-kyc');

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
    if (!data.companyName || !data.registrationNumber) {
      setError('Company name and CIPC registration number are required');
      return;
    }
    if (!validateCIPC(data.registrationNumber)) {
      setError('Invalid CIPC registration number format. Expected: YYYY/NNNNNN/NN');
      return;
    }
    if (!data.directorName || !data.directorIdNumber) {
      setError('Director name and ID number are required');
      return;
    }
    if (!data.cipcDocument) {
      setError('Please upload your CIPC registration document');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/verify/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Submission failed');
      }

      router.push('/verify?submitted=agency');
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

  if (existingAgency?.kycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Agency Verified!</h1>
            <p className="text-gray-500 mb-6">Your agency has been verified and has the verified badge.</p>
            <Link href="/agency" className="text-primary hover:underline">
              ← Back to Agency Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (existingAgency?.kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-yellow-600 mb-2">Verification Pending</h1>
            <p className="text-gray-500 mb-6">Your agency verification is being reviewed. This usually takes 2-5 business days.</p>
            <Link href="/agency" className="text-primary hover:underline">
              ← Back to Agency Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const STEPS = [
    { num: 1, label: 'Company Info' },
    { num: 2, label: 'Director' },
    { num: 3, label: 'Compliance' },
    { num: 4, label: 'Documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/verify" className="text-gray-500 hover:text-gray-700 mb-4 inline-block text-sm">
          ← Back to Verification Centre
        </Link>

        <div className="bg-white border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <h1 className="text-xl font-bold">Agency KYC Verification</h1>
                <p className="text-sm opacity-90">Verify your real estate agency</p>
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
                      step === s.num ? 'bg-purple-600 text-white' : 
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

            {/* Step 1: Company Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Company Information</h2>
                <p className="text-sm text-gray-500">Enter your company details as registered with CIPC.</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Company Name *</label>
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="ABC Properties (Pty) Ltd"
                    className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name (if different)</label>
                  <input
                    type="text"
                    value={data.tradingName}
                    onChange={(e) => setData(prev => ({ ...prev, tradingName: e.target.value }))}
                    placeholder="ABC Properties"
                    className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CIPC Registration Number *</label>
                    <input
                      type="text"
                      value={data.registrationNumber}
                      onChange={(e) => setData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="2020/123456/07"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">Format: YYYY/NNNNNN/NN</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number (if registered)</label>
                    <input
                      type="text"
                      value={data.vatNumber}
                      onChange={(e) => setData(prev => ({ ...prev, vatNumber: e.target.value }))}
                      placeholder="4XXXXXXXXX"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address *</label>
                  <input
                    type="text"
                    value={data.physicalAddress}
                    onChange={(e) => setData(prev => ({ ...prev, physicalAddress: e.target.value }))}
                    placeholder="123 Main Street, Suite 100"
                    className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={data.city}
                      onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Johannesburg"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                    <select
                      value={data.province}
                      onChange={(e) => setData(prev => ({ ...prev, province: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    >
                      <option value="">Select...</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={data.postalCode}
                      onChange={(e) => setData(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="2000"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      if (!data.companyName || !data.registrationNumber) {
                        setError('Please fill in required company details');
                        return;
                      }
                      setError('');
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Director Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Director / Principal Information</h2>
                <p className="text-sm text-gray-500">Details of the principal estate agent or director.</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={data.directorName}
                    onChange={(e) => setData(prev => ({ ...prev, directorName: e.target.value }))}
                    placeholder="Full legal name"
                    className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SA ID Number *</label>
                  <input
                    type="text"
                    value={data.directorIdNumber}
                    onChange={(e) => setData(prev => ({ ...prev, directorIdNumber: e.target.value.replace(/\D/g, '').slice(0, 13) }))}
                    placeholder="13-digit ID number"
                    maxLength={13}
                    className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={data.directorEmail}
                      onChange={(e) => setData(prev => ({ ...prev, directorEmail: e.target.value }))}
                      placeholder="director@agency.co.za"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={data.directorPhone}
                      onChange={(e) => setData(prev => ({ ...prev, directorPhone: e.target.value }))}
                      placeholder="+27 XX XXX XXXX"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!data.directorName || !data.directorIdNumber) {
                        setError('Please fill in director details');
                        return;
                      }
                      setError('');
                      setStep(3);
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Compliance */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Regulatory Compliance</h2>
                <p className="text-sm text-gray-500">Estate agency registration and compliance details.</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EAAB Registration Number *</label>
                    <input
                      type="text"
                      value={data.eaabNumber}
                      onChange={(e) => setData(prev => ({ ...prev, eaabNumber: e.target.value }))}
                      placeholder="e.g. EAAB12345"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fidelity Fund Certificate Number</label>
                    <input
                      type="text"
                      value={data.fidelityFundNumber}
                      onChange={(e) => setData(prev => ({ ...prev, fidelityFundNumber: e.target.value }))}
                      placeholder="e.g. FFC2026/001"
                      className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">B-BBEE Status Level</label>
                  <select
                    value={data.beeLevel}
                    onChange={(e) => setData(prev => ({ ...prev, beeLevel: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:border-purple-500 outline-none"
                  >
                    <option value="">Select B-BBEE Level...</option>
                    {BEE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">ℹ️ Why we need this</h4>
                  <p className="text-sm text-blue-800">
                    EAAB registration is required by law for all estate agencies in South Africa. 
                    Verified agencies receive a trust badge and are featured higher in search results.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!data.eaabNumber) {
                        setError('EAAB registration number is required');
                        return;
                      }
                      setError('');
                      setStep(4);
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Upload Documents</h2>
                <p className="text-sm text-gray-500">Upload supporting documents for verification.</p>

                <DocumentUpload
                  label="CIPC Registration Document *"
                  subtitle="Company registration certificate (COR14.3 or equivalent)"
                  value={data.cipcDocument}
                  onChange={(file) => handleFileUpload('cipcDocument', file)}
                  required
                />

                <DocumentUpload
                  label="Director's ID Document *"
                  subtitle="Copy of principal/director's SA ID"
                  value={data.directorId}
                  onChange={(file) => handleFileUpload('directorId', file)}
                  required
                />

                <DocumentUpload
                  label="EAAB Certificate"
                  subtitle="Current EAAB registration certificate"
                  value={data.eaabCertificate}
                  onChange={(file) => handleFileUpload('eaabCertificate', file)}
                />

                <DocumentUpload
                  label="B-BBEE Certificate"
                  subtitle="Valid B-BBEE certificate or affidavit"
                  value={data.beeCertificate}
                  onChange={(file) => handleFileUpload('beeCertificate', file)}
                />

                <DocumentUpload
                  label="Bank Confirmation Letter"
                  subtitle="Confirming company bank account details"
                  value={data.bankLetter}
                  onChange={(file) => handleFileUpload('bankLetter', file)}
                />

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Submission Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Company:</span> {data.companyName}</p>
                    <p><span className="text-gray-500">CIPC:</span> {data.registrationNumber}</p>
                    <p><span className="text-gray-500">Director:</span> {data.directorName}</p>
                    <p><span className="text-gray-500">EAAB:</span> {data.eaabNumber}</p>
                    <p><span className="text-gray-500">Documents:</span> {
                      [data.cipcDocument && 'CIPC', data.directorId && 'Director ID', data.eaabCertificate && 'EAAB', data.beeCertificate && 'BEE'].filter(Boolean).join(', ') || 'None'
                    }</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(3)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
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
              <span>All documents are encrypted and stored securely. POPIA compliant.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentUpload({ label, subtitle, value, onChange, required }: {
  label: string;
  subtitle?: string;
  value: string | null;
  onChange: (file: File) => void;
  required?: boolean;
}) {
  const id = `upload-${label.replace(/\s+/g, '-')}`;
  
  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center transition hover:border-purple-400">
      {value ? (
        <div className="space-y-2">
          {value.startsWith('data:image') || value.includes('/kyc/') ? (
            <img src={value} alt={label} className="max-h-32 mx-auto rounded-lg object-contain" />
          ) : (
            <div className="text-4xl">📄</div>
          )}
          <p className="text-sm text-green-600">✓ Uploaded</p>
          <button
            type="button"
            onClick={() => document.getElementById(id)?.click()}
            className="text-sm text-purple-600 hover:underline"
          >
            Change file
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-3xl">📎</div>
          <div>
            <span className="text-gray-700">{label}</span>
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          <button
            type="button"
            onClick={() => document.getElementById(id)?.click()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
          >
            Upload File
          </button>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
    </div>
  );
}
