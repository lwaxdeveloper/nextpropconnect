"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ConversationCard from "@/components/ConversationCard";

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

export default function AgentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState(0);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setUserId(data.userId);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const otherName = c.buyer_id === userId ? c.seller_name : c.buyer_name;
    const searchLower = search.toLowerCase();
    return (
      otherName.toLowerCase().includes(searchLower) ||
      (c.property_title?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <Link
          href="/properties"
          className="text-primary hover:underline text-sm"
        >
          Browse Properties
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Conversations */}
      {filteredConversations.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-6">
            Start a conversation by contacting a buyer on any property listing
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
          >
            🏠 Browse Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/agent/messages/${conversation.id}`}
            >
              <ConversationCard
                conversation={conversation}
                currentUserId={userId}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
