import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { otherUserId, propertyId } = await request.json();

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 });
    }

    // Find existing conversation between these two users (optionally for a specific property)
    let result;
    
    if (propertyId) {
      // Look for conversation about this specific property
      result = await query(
        `SELECT id FROM conversations 
         WHERE property_id = $1
         AND ((buyer_id = $2 AND seller_id = $3) OR (buyer_id = $3 AND seller_id = $2))
         LIMIT 1`,
        [propertyId, userId, otherUserId]
      );
    }
    
    // If no property-specific conversation, look for any conversation between the users
    if (!result || result.rows.length === 0) {
      result = await query(
        `SELECT id FROM conversations 
         WHERE (buyer_id = $1 AND seller_id = $2) OR (buyer_id = $2 AND seller_id = $1)
         ORDER BY last_message_at DESC
         LIMIT 1`,
        [userId, otherUserId]
      );
    }

    if (result.rows.length > 0) {
      return NextResponse.json({ conversationId: result.rows[0].id });
    }

    return NextResponse.json({ conversationId: null });
  } catch (error) {
    console.error('Find conversation error:', error);
    return NextResponse.json({ error: 'Failed to find conversation' }, { status: 500 });
  }
}
