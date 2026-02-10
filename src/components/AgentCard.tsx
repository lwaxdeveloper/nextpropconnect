"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookViewingModal from "./BookViewingModal";

export interface AgentData {
  id: number;
  user_id: number;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  agency_name: string | null;
  trust_score: number;
  is_verified: boolean;
}

export default function AgentCard({
  agent,
  showContact = true,
  propertyId,
  propertyTitle,
}: {
  agent: AgentData;
  showContact?: boolean;
  propertyId?: number;
  propertyTitle?: string;
}) {
  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);
  const [showViewingModal, setShowViewingModal] = useState(false);

  const handleChat = async () => {
    setChatLoading(true);
    try {
      // Check if logged in
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session?.user) {
        router.push(`/login?callbackUrl=/properties/${propertyId || ""}`);
        return;
      }

      // Create or find conversation
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId || null,
          seller_id: agent.user_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.id}`);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // NextPropConnect Business WhatsApp - messages come through MsgHub
  const PROPCONNECT_WHATSAPP = "27690508342";
  const whatsappUrl = `https://wa.me/${PROPCONNECT_WHATSAPP}?text=${encodeURIComponent(
    `Hi! 👋\n\nI'm interested in: "${propertyTitle || "a property"}"\n` +
    (propertyId ? `https://nextnextpropconnect.co.za/properties/${propertyId}\n\n` : "\n") +
    `Agent: ${agent.name}\n\nCould you please share more details?`
  )}`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-4 mb-4">
        {agent.avatar_url ? (
          <img
            src={agent.avatar_url}
            alt={agent.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {agent.name.charAt(0)}
          </div>
        )}
        <div>
          <Link
            href={`/agents/${agent.id}`}
            className="font-bold text-dark hover:text-primary transition"
          >
            {agent.name}
          </Link>
          {agent.agency_name && (
            <p className="text-sm text-gray-500">{agent.agency_name}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {agent.is_verified && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Verified
              </span>
            )}
            <span className="text-xs text-gray-400">
              Trust score: {agent.trust_score}/100
            </span>
          </div>
        </div>
      </div>

      {agent.phone && (
        <p className="text-sm text-gray-600 mb-3">📱 {agent.phone}</p>
      )}

      {showContact && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Link
              href={`/agents/${agent.id}`}
              className="flex-1 text-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
            >
              View Profile
            </Link>
            <button
              onClick={handleChat}
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
            >
              {chatLoading ? "..." : "💬 Chat"}
            </button>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:bg-[#128C7E] transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            📲 WhatsApp
          </a>
          {propertyId && (
            <button
              onClick={() => setShowViewingModal(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-secondary/10 text-secondary rounded-xl text-sm font-medium hover:bg-secondary/20 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book a Viewing
            </button>
          )}
        </div>
      )}
      
      {propertyId && propertyTitle && (
        <BookViewingModal
          isOpen={showViewingModal}
          onClose={() => setShowViewingModal(false)}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          agentName={agent.name}
        />
      )}
    </div>
  );
}
