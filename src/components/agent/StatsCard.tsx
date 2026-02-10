"use client";

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  href?: string;
}

export default function StatsCard({ icon, label, value, change, changeType = "neutral", href }: StatsCardProps) {
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${
        href ? "hover:border-primary/30 hover:shadow-md transition cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              changeType === "up"
                ? "bg-green-50 text-green-600"
                : changeType === "down"
                ? "bg-red-50 text-red-600"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-dark">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </Wrapper>
  );
}
