import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/conversations — list user's conversations
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");

  const result = await query(
    `SELECT c.*,
      p.title as property_title, p.price as property_price, p.listing_type,
      (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as property_image,
      buyer.name as buyer_name, buyer.avatar_url as buyer_avatar,
      seller.name as seller_name, seller.avatar_url as seller_avatar,
      (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT message_type FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_type,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE)::int as unread_count
    FROM conversations c
    LEFT JOIN properties p ON c.property_id = p.id
    JOIN users buyer ON c.buyer_id = buyer.id
    JOIN users seller ON c.seller_id = seller.id
    WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND c.status = 'active'
    ORDER BY c.last_message_at DESC`,
    [userId]
  );

  return NextResponse.json(result.rows);
}

// POST /api/conversations — create or find existing conversation
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const body = await request.json();
  const { property_id, seller_id } = body;

  if (!seller_id) {
    return NextResponse.json({ error: "seller_id is required" }, { status: 400 });
  }

  if (userId === seller_id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Check for existing conversation
  const existing = await query(
    `SELECT id FROM conversations 
     WHERE property_id ${property_id ? '= $1' : 'IS NULL'} AND buyer_id = $2 AND seller_id = $3`,
    property_id ? [property_id, userId, seller_id] : [userId, seller_id]
  );

  if (existing.rows.length > 0) {
    return NextResponse.json({ id: existing.rows[0].id, existing: true });
  }

  // Create new conversation
  const result = await query(
    `INSERT INTO conversations (property_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id`,
    [property_id || null, userId, seller_id]
  );

  return NextResponse.json({ id: result.rows[0].id, existing: false }, { status: 201 });
}
