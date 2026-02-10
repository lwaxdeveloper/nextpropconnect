"use client";

import ViewingRequestCard from "./ViewingRequestCard";

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

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  conversationId: number;
  onViewingAction?: (viewingId: number, status: string) => void;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBubble({ message, isOwn, conversationId, onViewingAction }: ChatBubbleProps) {
  // Handle viewing request messages
  if (message.message_type === "viewing_request") {
    let viewingData;
    try {
      viewingData = JSON.parse(message.content);
    } catch {
      viewingData = null;
    }

    if (viewingData) {
      return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
          <div className="max-w-[85%] sm:max-w-[70%]">
            <ViewingRequestCard
              viewing={viewingData}
              isOwn={isOwn}
              conversationId={conversationId}
              onAction={onViewingAction}
            />
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
              <span className="text-[11px] text-gray-400">{formatTime(message.created_at)}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] sm:max-w-[70%]`}>
        {!isOwn && (
          <span className="text-[11px] text-gray-400 ml-1 mb-0.5 block">{message.sender_name}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isOwn
              ? "bg-[#25D366] text-white rounded-br-md"
              : "bg-[#F0F2F5] text-gray-900 rounded-bl-md"
          }`}
        >
          {message.content}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className="text-[11px] text-gray-400">{formatTime(message.created_at)}</span>
          {isOwn && (
            <span 
              className={`text-[11px] ${message.is_read ? "text-blue-500" : "text-gray-400"}`}
              title={message.read_at ? `Read ${formatTime(message.read_at)}` : "Delivered"}
            >
              {message.is_read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
