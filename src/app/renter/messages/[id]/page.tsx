import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { query } from "@/lib/db";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function RenterConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; name?: string };
  const userId = parseInt(user.id || "0");
  const { id } = await params;
  const conversationId = parseInt(id);

  // Fetch conversation with other user info
  const convResult = await query(
    `SELECT c.*,
       CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END as other_user_id,
       u.name as other_user_name, u.avatar_url as other_user_avatar,
       p.title as property_title
     FROM conversations c
     JOIN users u ON u.id = CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END
     LEFT JOIN properties p ON c.property_id = p.id
     WHERE c.id = $2 AND (c.buyer_id = $1 OR c.seller_id = $1)`,
    [userId, conversationId]
  );

  if (convResult.rows.length === 0) {
    notFound();
  }

  const conversation = convResult.rows[0];

  // Fetch messages
  const messagesResult = await query(
    `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [conversationId]
  );

  // Mark as read
  await query(
    `UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
    [conversationId, userId]
  );

  return (
    <ChatClient
      conversation={conversation}
      initialMessages={messagesResult.rows}
      currentUserId={userId}
      currentUserName={user.name || "You"}
    />
  );
}
