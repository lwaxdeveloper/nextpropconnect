import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id] — get conversation details
export async function GET(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const convId = parseInt(id);

  const result = await query(
    `SELECT c.*,
      p.id as property_id, p.title as property_title, p.price as property_price, p.listing_type,
      p.suburb as property_suburb, p.city as property_city,
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as property_image,
      buyer.id as buyer_user_id, buyer.name as buyer_name, buyer.avatar_url as buyer_avatar,
      seller.id as seller_user_id, seller.name as seller_name, seller.avatar_url as seller_avatar, seller.phone as seller_phone
    FROM conversations c
    LEFT JOIN properties p ON c.property_id = p.id
    JOIN users buyer ON c.buyer_id = buyer.id
    JOIN users seller ON c.seller_id = seller.id
    WHERE c.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
    [convId, userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
