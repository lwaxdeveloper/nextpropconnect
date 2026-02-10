/**
 * POST /api/conversations/[id]/typing
 * Report that user is typing
 * 
 * GET /api/conversations/[id]/typing
 * Check if other user is typing (within last 3 seconds)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// POST - report typing
export async function POST(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const convId = parseInt(id);

  // Verify participant and get role
  const conv = await query(
    "SELECT buyer_id, seller_id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)",
    [convId, userId]
  );
  
  if (conv.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isBuyer = conv.rows[0].buyer_id === userId;
  const column = isBuyer ? "buyer_typing_at" : "seller_typing_at";

  await query(
    `UPDATE conversations SET ${column} = NOW() WHERE id = $1`,
    [convId]
  );

  return NextResponse.json({ ok: true });
}

// GET - check if other user is typing
export async function GET(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const convId = parseInt(id);

  // Get conversation and check typing status
  const result = await query(
    `SELECT buyer_id, seller_id, buyer_typing_at, seller_typing_at,
            buyer.name as buyer_name, seller.name as seller_name
     FROM conversations c
     JOIN users buyer ON c.buyer_id = buyer.id
     JOIN users seller ON c.seller_id = seller.id
     WHERE c.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
    [convId, userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conv = result.rows[0];
  const isBuyer = conv.buyer_id === userId;
  
  // Check if the OTHER person is typing (within last 3 seconds)
  const otherTypingAt = isBuyer ? conv.seller_typing_at : conv.buyer_typing_at;
  const otherName = isBuyer ? conv.seller_name : conv.buyer_name;
  
  let isTyping = false;
  if (otherTypingAt) {
    const typingTime = new Date(otherTypingAt).getTime();
    const now = Date.now();
    isTyping = (now - typingTime) < 3000; // 3 seconds
  }

  return NextResponse.json({ 
    isTyping, 
    name: isTyping ? otherName : null 
  });
}
