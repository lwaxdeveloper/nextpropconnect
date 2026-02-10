"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Phone, Loader2, CheckCheck, Clock } from "lucide-react";
import Link from "next/link";

interface Message {
  id: number;
  content: string;
  direction: "inbound" | "outbound";
  status: string;
  createdAt: string;
  isFromCustomer: boolean;
}

interface Conversation {
  id: number;
  phoneNumber: string;
  userName: string;
  propertyTitle: string | null;
  status: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    // Auto-refresh messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/agent/whatsapp/${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/agent/whatsapp/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }

      // Add the new message to the list
      setMessages(prev => [...prev, data.message]);
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Conversation not found</p>
        <Link href="/agent/conversations" className="text-blue-600 mt-2 inline-block">
          Back to conversations
        </Link>
      </div>
    );
  }

  // Group messages by date
  const messagesByDate: { [date: string]: Message[] } = {};
  messages.forEach(msg => {
    const date = formatDate(msg.createdAt);
    if (!messagesByDate[date]) messagesByDate[date] = [];
    messagesByDate[date].push(msg);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link 
          href="/agent/conversations"
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Phone className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{conversation.userName}</h2>
          <p className="text-sm text-gray-500">+{conversation.phoneNumber}</p>
        </div>
        {conversation.propertyTitle && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {conversation.propertyTitle}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {Object.entries(messagesByDate).map(([date, dayMessages]) => (
          <div key={date}>
            <div className="text-center my-4">
              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            {dayMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex mb-3 ${msg.isFromCustomer ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    msg.isFromCustomer
                      ? "bg-white border shadow-sm"
                      : "bg-green-600 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${
                    msg.isFromCustomer ? "text-gray-400" : "text-green-200"
                  }`}>
                    {formatTime(msg.createdAt)}
                    {!msg.isFromCustomer && (
                      msg.status === "sent" ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
