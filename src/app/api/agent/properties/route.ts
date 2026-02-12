import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  try {
    const result = await query(
      `SELECT 
        p.*,
        (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM leads WHERE property_id = p.id) as inquiries_count
       FROM properties p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ properties: result.rows });
  } catch (error) {
    console.error("Error fetching agent properties:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
