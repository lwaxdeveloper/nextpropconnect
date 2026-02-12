import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RenterProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Get user profile
  const userResult = await query(
    `SELECT u.*, 
       u.identity_verified,
       u.avatar_url
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );
  const profile = userResult.rows[0];

  // Calculate profile completion
  const completionFields = [
    { key: 'name', label: 'Full Name', value: profile?.name },
    { key: 'email', label: 'Email', value: profile?.email },
    { key: 'phone', label: 'Phone Number', value: profile?.phone },
    { key: 'avatar_url', label: 'Profile Photo', value: profile?.avatar_url },
    { key: 'id_number', label: 'ID Number', value: profile?.id_number },
    { key: 'date_of_birth', label: 'Date of Birth', value: profile?.date_of_birth },
    { key: 'nationality', label: 'Nationality', value: profile?.nationality },
    { key: 'identity_verified', label: 'Identity Verified', value: profile?.identity_verified },
  ];

  const completedCount = completionFields.filter(f => f.value).length;
  const completionPercent = Math.round((completedCount / completionFields.length) * 100);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">👤 My Profile</h1>

        {/* Profile Completion Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="35"
                  stroke={completionPercent >= 80 ? '#22c55e' : completionPercent >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={220}
                  strokeDashoffset={220 - (220 * completionPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{completionPercent}%</span>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg">Profile Completion</h2>
              <p className="text-sm text-gray-500">
                {completionPercent === 100 
                  ? 'Your profile is complete!' 
                  : `Complete your profile to unlock all features`}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {completionFields.map((field) => (
              <div 
                key={field.key} 
                className={`flex items-center gap-3 p-2 rounded-lg ${field.value ? 'text-green-700' : 'text-gray-400'}`}
              >
                {field.value ? (
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                ) : (
                  <span className="w-5 h-5 border-2 border-gray-300 rounded-full"></span>
                )}
                <span className="text-sm">{field.label}</span>
              </div>
            ))}
          </div>

          {!profile?.identity_verified && (
            <Link
              href="/verify"
              className="mt-4 block w-full text-center py-3 bg-gradient-to-r from-blue-500 to-primary text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              ✓ Get Verified Now
            </Link>
          )}
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h2 className="font-bold text-lg mb-4">Personal Information</h2>
          
          <form className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                  {profile?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition cursor-pointer">
                  Change Photo
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={profile?.name || ''}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue={profile?.email || ''}
                disabled
                className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                defaultValue={profile?.phone || ''}
                placeholder="082 123 4567"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SA ID Number</label>
              <input
                type="text"
                defaultValue={profile?.id_number || ''}
                placeholder="Enter your 13-digit ID number"
                maxLength={13}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                defaultValue={profile?.date_of_birth?.split('T')[0] || ''}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <select
                defaultValue={profile?.nationality || ''}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select nationality</option>
                <option value="South African">South African</option>
                <option value="Zimbabwean">Zimbabwean</option>
                <option value="Nigerian">Nigerian</option>
                <option value="Mozambican">Mozambican</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
