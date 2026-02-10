import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  const userResult = await query(
    `SELECT id, name, email, phone, avatar_url, role FROM users WHERE id = $1`,
    [userId]
  );

  const profileResult = await query(
    `SELECT * FROM agent_profiles WHERE user_id = $1`,
    [userId]
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-6">Agent Profile</h1>
      <ProfileClient
        data={{
          user: userResult.rows[0],
          profile: profileResult.rows[0] || null,
        }}
      />
    </div>
  );
}
