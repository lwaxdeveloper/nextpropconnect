"use client";

import Link from "next/link";

interface ConversationCardProps {
  conversation: {
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
  };
  currentUserId: number;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ConversationCard({ conversation: c, currentUserId }: ConversationCardProps) {
  const otherName = c.buyer_id === currentUserId ? c.seller_name : c.buyer_name;
  const otherAvatar = c.buyer_id === currentUserId ? c.seller_avatar : c.buyer_avatar;

  let lastMessagePreview = c.last_message || "No messages yet";
  if (c.last_message_type === "viewing_request") {
    lastMessagePreview = "📅 Viewing request";
  } else if (lastMessagePreview.length > 60) {
    lastMessagePreview = lastMessagePreview.slice(0, 60) + "…";
  }

  return (
    <Link
      href={`/messages/${c.id}`}
      className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition group"
    >
      {/* Property image or avatar */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gray-100 overflow-hidden">
        {c.property_image ? (
          <img src={c.property_image} alt="" className="w-full h-full object-cover" />
        ) : otherAvatar ? (
          <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
            {otherName?.charAt(0) || "?"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`text-sm font-bold truncate ${c.unread_count > 0 ? "text-dark" : "text-gray-700"}`}>
            {otherName}
          </h3>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {timeAgo(c.last_message_at)}
          </span>
        </div>

        {c.property_title && (
          <p className="text-xs text-primary truncate">
            {c.property_title}
            {c.property_price && ` · ${formatPrice(Number(c.property_price))}`}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-sm truncate ${c.unread_count > 0 ? "text-dark font-medium" : "text-gray-500"}`}>
            {lastMessagePreview}
          </p>
          {c.unread_count > 0 && (
            <span className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
              {c.unread_count > 9 ? "9+" : c.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
