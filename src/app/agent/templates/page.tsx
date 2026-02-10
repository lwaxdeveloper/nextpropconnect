import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import TemplatesClient from "./TemplatesClient";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const session = await auth();
  const user = session!.user as { id?: string };

  const result = await query(
    `SELECT * FROM quick_replies WHERE agent_id = $1 ORDER BY usage_count DESC, created_at DESC`,
    [parseInt(user.id || "0")]
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-6">Quick Reply Templates</h1>
      <TemplatesClient initialTemplates={result.rows} />
    </div>
  );
}
