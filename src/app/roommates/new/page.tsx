'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function NewRoommateListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'offering';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    type: initialType,
    title: '',
    description: '',
    area: '',
    city: '',
    province: '',
    rentAmount: '',
    depositAmount: '',
    availableFrom: '',
    isFurnished: false,
    hasOwnBathroom: false,
    budgetMin: '',
    budgetMax: '',
    moveInDate: '',
    preferredGender: 'any',
    preferredAgeMin: '',
    preferredAgeMax: '',
    smokerFriendly: false,
    petFriendly: false,
    couplesOk: false,
    myAge: '',
    myGender: '',
    myOccupation: '',
    aboutMe: '',
    lifestyle: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/roommates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : null,
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
          myAge: formData.myAge ? parseInt(formData.myAge) : null,
          preferredAgeMin: formData.preferredAgeMin ? parseInt(formData.preferredAgeMin) : null,
          preferredAgeMax: formData.preferredAgeMax ? parseInt(formData.preferredAgeMax) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create listing');
      }

      const listing = await res.json();
      router.push(`/roommates/${listing.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const isOffering = formData.type === 'offering';

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/roommates" className="text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Back to Roommates
        </Link>

        <div className="bg-card border rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isOffering ? '🏠 Post a Room' : '🔍 Looking for a Room'}
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'offering' }))}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  isOffering ? 'bg-green-100 text-green-800 border-2 border-green-500' : 'bg-muted'
                }`}
              >
                🏠 I Have a Room
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'seeking' }))}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  !isOffering ? 'bg-blue-100 text-blue-800 border-2 border-blue-500' : 'bg-muted'
                }`}
              >
                🔍 I Need a Room
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={isOffering ? "Cozy room in Sandton apartment" : "Looking for a room in Johannesburg"}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={isOffering ? "Describe the room and living situation..." : "Tell people about yourself and what you're looking for..."}
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Area</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="Sandton"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Johannesburg"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Province</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="North West">North West</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>
            </div>

            {/* Room Details (for offering) */}
            {isOffering && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium">Room Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Rent (R) *</label>
                    <input
                      type="number"
                      value={formData.rentAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                      placeholder="4500"
                      className="w-full px-4 py-2 border rounded-lg"
                      required={isOffering}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Deposit (R)</label>
                    <input
                      type="number"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                      placeholder="4500"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Available From</label>
                    <input
                      type="date"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, availableFrom: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isFurnished}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFurnished: e.target.checked }))}
                    />
                    Furnished
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.hasOwnBathroom}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasOwnBathroom: e.target.checked }))}
                    />
                    Own Bathroom
                  </label>
                </div>
              </div>
            )}

            {/* Budget (for seeking) */}
            {!isOffering && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium">Your Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Budget (R)</label>
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
                      placeholder="2000"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Budget (R)</label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
                      placeholder="5000"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Move-in Date</label>
                    <input
                      type="date"
                      value={formData.moveInDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preferences */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium">Roommate Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Gender</label>
                  <select
                    value={formData.preferredGender}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredGender: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Age</label>
                  <input
                    type="number"
                    value={formData.preferredAgeMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredAgeMin: e.target.value }))}
                    placeholder="18"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Age</label>
                  <input
                    type="number"
                    value={formData.preferredAgeMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredAgeMax: e.target.value }))}
                    placeholder="40"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.smokerFriendly}
                    onChange={(e) => setFormData(prev => ({ ...prev, smokerFriendly: e.target.checked }))}
                  />
                  Smokers OK
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.petFriendly}
                    onChange={(e) => setFormData(prev => ({ ...prev, petFriendly: e.target.checked }))}
                  />
                  Pets OK
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.couplesOk}
                    onChange={(e) => setFormData(prev => ({ ...prev, couplesOk: e.target.checked }))}
                  />
                  Couples OK
                </label>
              </div>
            </div>

            {/* About Me */}
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium">About You</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Age</label>
                  <input
                    type="number"
                    value={formData.myAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, myAge: e.target.value }))}
                    placeholder="25"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your Gender</label>
                  <select
                    value={formData.myGender}
                    onChange={(e) => setFormData(prev => ({ ...prev, myGender: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.myOccupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, myOccupation: e.target.value }))}
                    placeholder="Software Developer"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">About You</label>
                <textarea
                  value={formData.aboutMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, aboutMe: e.target.value }))}
                  placeholder="Tell potential roommates about yourself..."
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewRoommateListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <NewRoommateListingContent />
    </Suspense>
  );
}
