"use client";

interface Activity {
  id: number;
  activity_type: string;
  description: string;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  note: "📝",
  call: "📞",
  email: "📧",
  whatsapp: "💬",
  viewing: "🏠",
  offer: "💰",
  status_change: "🔄",
};

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <h4 className="font-bold text-dark text-sm mb-3">Activity Timeline</h4>
      {activities.map((activity, idx) => (
        <div key={activity.id} className="flex gap-3">
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm flex-shrink-0">
              {typeIcons[activity.activity_type] || "📌"}
            </div>
            {idx < activities.length - 1 && (
              <div className="w-px bg-gray-200 flex-1 min-h-[16px]" />
            )}
          </div>
          {/* Content */}
          <div className="pb-4 flex-1 min-w-0">
            <p className="text-sm text-dark">{activity.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(activity.created_at).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
