'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Agency {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  province: string;
  is_verified: boolean;
  subscription_tier: string;
  eaab_number: string;
  fidelity_fund_number: string;
  member_role: string;
}

export default function AgencySettings() {
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    province: '',
    eaab_number: '',
    fidelity_fund_number: '',
  });
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchAgency();
  }, []);

  async function fetchAgency() {
    try {
      const res = await fetch('/api/agencies?mine=true');
      if (res.ok) {
        const data = await res.json();
        if (data.agency) {
          const a = data.agency;
          setAgency(a);
          setForm({
            name: a.name || '',
            description: a.description || '',
            email: a.email || '',
            phone: a.phone || '',
            website: a.website || '',
            address: a.address || '',
            city: a.city || '',
            province: a.province || '',
            eaab_number: a.eaab_number || '',
            fidelity_fund_number: a.fidelity_fund_number || '',
          });
          setLogoUrl(a.logo_url || '');
          
          // Check authorization
          if (!['owner', 'admin'].includes(a.member_role)) {
            router.push('/agency');
          }
        } else {
          router.push('/agency');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !agency) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('Please select a JPG, PNG, WebP, or SVG image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', String(agency.id));

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await res.json();
      setLogoUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) return;

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/agencies/${agency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!agency) return null;

  const provinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/agency" className="text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Agency Settings</h1>
        </div>

        {/* Logo Section */}
        <div className="bg-card border-2 border-muted rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Agency Logo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Agency Logo"
                  className="w-24 h-24 rounded-xl object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-primary/20">
                  <span className="text-3xl">🏢</span>
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition ${
                  uploadingLogo
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP or SVG. Max 5MB. Recommended: 400x400px</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border-2 border-muted rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Agency Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none resize-none"
                  placeholder="Tell potential clients about your agency..."
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-card border-2 border-muted rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  placeholder="contact@agency.co.za"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  placeholder="https://www.agency.co.za"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-card border-2 border-muted rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Office Address</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Street Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  placeholder="123 Main Street, Suite 100"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                    placeholder="Johannesburg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Province</label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  >
                    <option value="">Select province</option>
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-card border-2 border-muted rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">EAAB Number</label>
                <input
                  type="text"
                  value={form.eaab_number}
                  onChange={(e) => setForm({ ...form, eaab_number: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  placeholder="e.g. EAAB12345"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Fidelity Fund Number</label>
                <input
                  type="text"
                  value={form.fidelity_fund_number}
                  onChange={(e) => setForm({ ...form, fidelity_fund_number: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none"
                  placeholder="e.g. FFC2026/001"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 font-bold rounded-xl transition text-sm ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary text-white hover:bg-primary/90'
            } disabled:opacity-50`}
          >
            {saving ? 'Saving...' : saved ? '✓ Settings Saved!' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
