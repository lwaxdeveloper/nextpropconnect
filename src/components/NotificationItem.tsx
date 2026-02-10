"use client";

import Link from "next/link";

interface NotificationItemProps {
  notification: {
    id: number;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
  };
  onMarkRead?: (id: number) => void;
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
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const typeIcons: Record<string, string> = {
  new_message: "💬",
  viewing_request: "📅",
  viewing_confirmed: "✅",
  price_drop: "📉",
  new_listing: "🏠",
};

export default function NotificationItem({ notification: n, onMarkRead }: NotificationItemProps) {
  return (
    <Link
      href={n.link || "#"}
      onClick={() => { if (!n.is_read && onMarkRead) onMarkRead(n.id); }}
      className={`flex items-start gap-3 p-4 rounded-2xl border transition hover:shadow-md ${
        !n.is_read ? "bg-primary/5 border-primary/20" : "bg-white border-gray-100"
      }`}
    >
      <span className="text-2xl mt-0.5">{typeIcons[n.type] || "🔔"}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!n.is_read ? "font-bold text-dark" : "text-gray-700"}`}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-2" />
      )}
    </Link>
  );
}
