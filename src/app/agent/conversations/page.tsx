"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Clock, ChevronRight } from "lucide-react";

interface Conversation {
  id: number;
  phoneNumber: string;
  userName: string;
  propertyTitle: string | null;
  status: string;
  messageCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

export default function WhatsAppConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/agent/whatsapp");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConversations(data.conversations);
      setError(null);
    } catch (err) {
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string | null) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">WhatsApp Conversations</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="text-green-600" />
          WhatsApp Conversations
        </h1>
        <span className="text-sm text-gray-500">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No conversations yet</h3>
          <p className="text-gray-500 mt-2">
            WhatsApp messages from customers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map(conv => (
            <Link
              key={conv.id}
              href={`/agent/conversations/${conv.id}`}
              className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {conv.userName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      +{conv.phoneNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(conv.lastMessageAt || conv.updatedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {conv.lastMessage && (
                <p className="mt-2 text-sm text-gray-600 truncate pl-15">
                  {conv.lastMessage}
                </p>
              )}
              {conv.propertyTitle && (
                <p className="mt-1 text-xs text-blue-600 pl-15">
                  📍 {conv.propertyTitle}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
