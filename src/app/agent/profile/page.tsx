import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import ProfileClient from "./ProfileClient";
import ProfileCompletionCard from "@/components/agent/ProfileCompletionCard";

export const dynamic = "force-dynamic";

function calculateCompletion(user: Record<string, unknown>, profile: Record<string, unknown> | null): { score: number; missing: string[] } {
  const missing: string[] = [];
  let completed = 0;
  const total = 10;

  // User fields
  if (user.name) completed++; else missing.push("Full name");
  if (user.phone) completed++; else missing.push("Phone number");
  if (user.avatar_url) completed++; else missing.push("Profile photo");

  // Profile fields
  if (profile?.bio && (profile.bio as string).length > 50) completed++; else missing.push("Bio (50+ characters)");
  if (profile?.areas_served && (profile.areas_served as string[]).length > 0) completed++; else missing.push("Areas served");
  if (profile?.specializations && (profile.specializations as string[]).length > 0) completed++; else missing.push("Specializations");
  if (profile?.eaab_number) completed++; else missing.push("EAAB number");
  if (profile?.ffc_number) completed++; else missing.push("FFC number");
  if (profile?.commission_rate) completed++; else missing.push("Commission rate");
  if (profile?.agency_name || profile?.agency_id) completed++; else missing.push("Agency affiliation");

  return { score: Math.round((completed / total) * 100), missing };
}

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  const userResult = await query(
    `SELECT id, name, email, phone, avatar_url, role,
            identity_verified, agent_verified, verification_badge
     FROM users WHERE id = $1`,
    [userId]
  );

  const profileResult = await query(
    `SELECT * FROM agent_profiles WHERE user_id = $1`,
    [userId]
  );

  const userData = userResult.rows[0];
  const profileData = profileResult.rows[0] || null;
  const completion = calculateCompletion(userData, profileData);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">Agent Profile</h1>
      
      {/* Profile Completion Card */}
      <ProfileCompletionCard 
        score={completion.score} 
        missing={completion.missing}
        isVerified={userData?.agent_verified || false}
        identityVerified={userData?.identity_verified || false}
      />
      
      <ProfileClient
        data={{
          user: userData,
          profile: profileData,
        }}
      />
    </div>
  );
}
