import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RenterMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  let tenant: any = null;
  let conversations: any[] = [];

  try {
    // Get tenant's landlord info
    const tenantResult = await query(
      `SELECT t.landlord_id, u.name as landlord_name, u.avatar_url as landlord_avatar
       FROM tenants t
       JOIN users u ON t.landlord_id = u.id
       WHERE t.user_id = $1 AND t.status = 'active'
       LIMIT 1`,
      [userId]
    );
    tenant = tenantResult.rows[0] || null;

    // Get conversations
    const conversationsResult = await query(
      `SELECT c.*, 
         CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END as other_user_id,
         u.name as other_user_name, u.avatar_url as other_user_avatar,
         p.title as property_title,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
         (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
         (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END
       LEFT JOIN properties p ON c.property_id = p.id
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
      [userId]
    );
    conversations = conversationsResult.rows;
  } catch (err) {
    console.error("Messages page error:", err);
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">💬 Messages</h1>
            <p className="text-gray-500 text-sm">Chat with your landlord and property contacts</p>
          </div>
        </div>

        {/* Quick Contact - Landlord */}
        {tenant && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 p-4 mb-6">
            <p className="text-xs text-primary font-medium mb-2">QUICK CONTACT</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tenant.landlord_avatar ? (
                  <img src={tenant.landlord_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                    {tenant.landlord_name?.[0]?.toUpperCase() || 'L'}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{tenant.landlord_name}</p>
                  <p className="text-sm text-gray-500">Your Landlord</p>
                </div>
              </div>
              <Link
                href={`/renter/messages/new?to=${tenant.landlord_id}`}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
              >
                Message
              </Link>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden">
          {conversations.length > 0 ? (
            <div className="divide-y">
              {conversations.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                >
                  {conv.other_user_avatar ? (
                    <img src={conv.other_user_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                      {conv.other_user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{conv.other_user_name}</p>
                      {conv.last_message_at && (
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(new Date(conv.last_message_at))}
                        </span>
                      )}
                    </div>
                    {conv.property_title && (
                      <p className="text-xs text-primary truncate">{conv.property_title}</p>
                    )}
                    <p className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Start a conversation with your landlord or browse properties
              </p>
              <Link
                href="/properties"
                className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
              >
                🏠 Browse Properties
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}
