"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import ViewingModal from "@/components/ViewingModal";

interface Message {
  id: number;
  sender_id: number;
  content: string;
  message_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface ConversationDetail {
  id: number;
  property_id: number | null;
  property_title: string | null;
  property_price: number | null;
  property_image: string | null;
  property_suburb: string | null;
  property_city: string | null;
  listing_type: string | null;
  buyer_user_id: number;
  buyer_name: string;
  buyer_avatar: string | null;
  seller_user_id: number;
  seller_name: string;
  seller_avatar: string | null;
  seller_phone: string | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency", currency: "ZAR", minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.id as string);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState(0);
  const [viewingModalOpen, setViewingModalOpen] = useState(false);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const lastMessageIdRef = useRef(0);

  // Fetch session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user?.id) setUserId(parseInt(s.user.id));
        else router.push("/login?callbackUrl=/messages/" + conversationId);
      });
  }, [conversationId, router]);

  // Fetch conversation details
  useEffect(() => {
    if (!conversationId) return;
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setConversation)
      .catch(() => router.push("/messages"));
  }, [conversationId, router]);

  // Fetch messages
  const fetchMessages = useCallback(async (before?: number) => {
    try {
      const url = before
        ? `/api/conversations/${conversationId}/messages?before=${before}&limit=50`
        : `/api/conversations/${conversationId}/messages?limit=50`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      if (before) {
        // Prepend older messages
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
        if (data.messages.length > 0) {
          lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
        }
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) fetchMessages();
  }, [conversationId, fetchMessages]);

  // Poll for new messages and read receipt updates every 5 seconds
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages.length > 0) {
          const lastNew = data.messages[data.messages.length - 1].id;
          const hasNewMessages = lastNew !== lastMessageIdRef.current;
          
          // Always update messages to get read receipt status changes
          setMessages(data.messages);
          
          if (hasNewMessages) {
            lastMessageIdRef.current = lastNew;
            shouldScrollRef.current = true;
          }
        }
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Poll for typing indicator every 2 seconds
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/typing`);
        if (!res.ok) return;
        const data = await res.json();
        setTypingName(data.isTyping ? data.name : null);
      } catch { /* silent */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (shouldScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  // Initial scroll
  useEffect(() => {
    if (!loading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [loading]);

  // Load more on scroll to top
  const handleScroll = () => {
    if (!messagesContainerRef.current || !hasMore) return;
    if (messagesContainerRef.current.scrollTop < 50 && messages.length > 0) {
      fetchMessages(messages[0].id);
    }
  };

  // Send message
  const handleSend = async (content: string) => {
    setSending(true);
    shouldScrollRef.current = true;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastMessageIdRef.current = msg.id;
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Schedule viewing
  const handleScheduleViewing = async (date: string, time: string, notes: string) => {
    setViewingLoading(true);
    try {
      const res = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: conversation?.property_id,
          conversation_id: conversationId,
          proposed_date: date,
          proposed_time: time,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        setViewingModalOpen(false);
        // Refresh messages to show the viewing request
        shouldScrollRef.current = true;
        await fetchMessages();
      }
    } catch (err) {
      console.error("Failed to create viewing:", err);
    } finally {
      setViewingLoading(false);
    }
  };

  // Handle viewing action (confirm/decline) from within chat
  const handleViewingAction = async () => {
    shouldScrollRef.current = true;
    await fetchMessages();
  };

  if (!conversation || loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const otherName = conversation.buyer_user_id === userId ? conversation.seller_name : conversation.buyer_name;
  const otherAvatar = conversation.buyer_user_id === userId ? conversation.seller_avatar : conversation.buyer_avatar;

  return (
    <div className="h-screen flex flex-col bg-light">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Property info or avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 overflow-hidden">
            {conversation.property_image ? (
              <img src={conversation.property_image} alt="" className="w-full h-full object-cover" />
            ) : otherAvatar ? (
              <img src={otherAvatar} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                {otherName?.charAt(0) || "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-dark text-sm truncate">{otherName}</h2>
            {conversation.property_title && (
              <Link
                href={`/properties/${conversation.property_id}`}
                className="text-xs text-primary truncate block hover:underline"
              >
                {conversation.property_title}
                {conversation.property_price && ` · ${formatPrice(Number(conversation.property_price))}`}
              </Link>
            )}
          </div>

          {/* WhatsApp link if phone available */}
          {conversation.seller_phone && conversation.buyer_user_id === userId && (
            <a
              href={`https://wa.me/${conversation.seller_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hi, I'm interested in ${conversation.property_title || "your property"} listed on NextPropConnect`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition"
              title="Chat on WhatsApp"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={() => messages.length > 0 && fetchMessages(messages[0].id)}
              className="text-xs text-primary font-medium hover:text-primary-dark transition"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-500 text-sm">
              Start the conversation — say hello!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === userId}
            conversationId={conversationId}
            onViewingAction={handleViewingAction}
          />
        ))}
        
        {/* Typing indicator */}
        {typingName && (
          <div className="flex items-center gap-2 mb-3 ml-1">
            <div className="bg-gray-200 rounded-2xl px-4 py-2 flex items-center gap-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
            <span className="text-xs text-gray-400">{typingName} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onScheduleViewing={() => setViewingModalOpen(true)}
        disabled={sending}
        conversationId={conversationId}
      />

      {/* Viewing modal */}
      <ViewingModal
        isOpen={viewingModalOpen}
        onClose={() => setViewingModalOpen(false)}
        onSubmit={handleScheduleViewing}
        loading={viewingLoading}
      />
    </div>
  );
}
