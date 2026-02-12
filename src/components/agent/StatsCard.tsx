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
      className={`bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all ${
        href ? "hover:border-primary/50 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center">
          <span className="text-2xl">{icon}</span>
        </div>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              changeType === "up"
                ? "bg-green-100 text-green-700"
                : changeType === "down"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-dark">{value}</div>
      <div className="text-sm text-gray-600 mt-1 font-medium">{label}</div>
    </Wrapper>
  );
}
