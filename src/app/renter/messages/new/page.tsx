"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewRenterMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toUserId = searchParams.get("to");
  
  const [recipient, setRecipient] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (toUserId) {
      fetchRecipient();
    } else {
      setLoading(false);
    }
  }, [toUserId]);

  const fetchRecipient = async () => {
    try {
      const res = await fetch(`/api/users/${toUserId}/info`);
      if (res.ok) {
        const data = await res.json();
        setRecipient(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !toUserId) return;

    setSending(true);
    setError(null);

    try {
      // First create or get existing conversation
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: parseInt(toUserId) }),
      });

      if (!convRes.ok) {
        throw new Error("Failed to create conversation");
      }

      const { conversation_id } = await convRes.json();

      // Send the message
      const msgRes = await fetch(`/api/conversations/${conversation_id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });

      if (!msgRes.ok) {
        throw new Error("Failed to send message");
      }

      // Redirect to the conversation
      router.push(`/renter/messages/${conversation_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/renter/messages" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Messages
        </Link>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">💬 New Message</h1>
          
          {recipient && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
              {recipient.avatar_url ? (
                <img src={recipient.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {recipient.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <p className="font-semibold">{recipient.name}</p>
                <p className="text-sm text-gray-500">{recipient.role || "User"}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSend}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
