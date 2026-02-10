"use client";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: "w-8 h-8 text-lg", text: "text-lg" },
    md: { icon: "w-10 h-10 text-xl", text: "text-xl" },
    lg: { icon: "w-14 h-14 text-3xl", text: "text-3xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${s.icon} gradient-primary rounded-xl flex items-center justify-center font-black text-white shadow-lg`}
      >
        P
      </div>
      <span className={`${s.text} font-bold text-dark`}>
        Prop<span className="gradient-text">Connect</span>
      </span>
    </div>
  );
}
