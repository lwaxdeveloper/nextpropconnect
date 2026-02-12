"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ConversationCard from "@/components/ConversationCard";
import Navbar from "@/components/Navbar";

interface Conversation {
  id: number;
  property_title: string | null;
  property_price: number | null;
  property_image: string | null;
  listing_type: string | null;
  buyer_id: number;
  seller_id: number;
  buyer_name: string;
  buyer_avatar: string | null;
  seller_name: string;
  seller_avatar: string | null;
  last_message: string | null;
  last_message_type: string | null;
  last_message_at: string;
  unread_count: number;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState(0);
  const [creatingConversation, setCreatingConversation] = useState(false);

  useEffect(() => {
    // Check for ?to= parameter (redirected from property "Message" button)
    const toUserId = searchParams.get("to");
    const propertyId = searchParams.get("property");
    
    if (toUserId) {
      // Create or find conversation with this user
      createOrFindConversation(toUserId, propertyId);
    } else {
      fetchConversations();
    }
    
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [searchParams]);

  const createOrFindConversation = async (toUserId: string, propertyId: string | null) => {
    setCreatingConversation(true);
    try {
      // First check if conversation exists
      const res = await fetch("/api/conversations/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          otherUserId: parseInt(toUserId),
          propertyId: propertyId ? parseInt(propertyId) : null
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) {
          // Redirect to the conversation
          router.replace(`/messages/${data.conversationId}`);
          return;
        }
      }

      // If no conversation found, create a new one
      const createRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recipient_id: parseInt(toUserId),
          property_id: propertyId ? parseInt(propertyId) : null
        }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        router.replace(`/messages/${createData.conversation_id}`);
      } else {
        // Fall back to showing conversations list
        await fetchConversations();
      }
    } catch (err) {
      console.error("Failed to create/find conversation:", err);
      await fetchConversations();
    } finally {
      setCreatingConversation(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        // Infer userId from first conversation
        if (data.length > 0 && userId === 0) {
          // We'll use a separate session call
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            if (session?.user?.id) setUserId(parseInt(session.user.id));
          }
        }
      } else if (res.status === 401) {
        window.location.href = "/login?callbackUrl=/messages";
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.buyer_name?.toLowerCase().includes(q) ||
      c.seller_name?.toLowerCase().includes(q) ||
      c.property_title?.toLowerCase().includes(q)
    );
  });

  if (creatingConversation) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-gray-500">Opening conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-[72px] z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-dark">Messages</h1>
            <Link href="/properties" className="text-sm text-primary font-medium hover:text-primary-dark transition">
              Browse Properties
            </Link>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Conversations list */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-dark mb-2">
              {search ? "No matching conversations" : "No conversations yet"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {search
                ? "Try a different search term"
                : "Start a conversation by contacting an agent on any property listing"}
            </p>
            {!search && (
              <Link
                href="/properties"
                className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
              >
                🏠 Browse Properties
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <ConversationCard key={c.id} conversation={c} currentUserId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
