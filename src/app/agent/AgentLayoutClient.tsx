"use client";

import { useRouter } from "next/navigation";
import AgentSidebar from "@/components/agent/AgentSidebar";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function AgentLayoutClient({ children, userName }: { children: React.ReactNode; userName: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const res = await fetch("/api/auth/csrf");
    const { csrfToken } = await res.json();
    const form = new FormData();
    form.append("csrfToken", csrfToken);
    await fetch("/api/auth/signout", { method: "POST", body: form });
    router.push("/");
    router.refresh();
  }

  const mobileNav = [
    { icon: "📊", label: "Overview", href: "/agent" },
    { icon: "👥", label: "Leads", href: "/agent/leads" },
    { icon: "💬", label: "Messages", href: "/messages" },
    { icon: "📲", label: "WhatsApp", href: "/agent/conversations" },
    { icon: "📈", label: "Analytics", href: "/agent/analytics" },
    { icon: "⭐", label: "Reviews", href: "/agent/reviews" },
    { icon: "💰", label: "Commissions", href: "/agent/commissions" },
    { icon: "📱", label: "Social", href: "/agent/social" },
    { icon: "⚡", label: "Templates", href: "/agent/templates" },
    { icon: "👤", label: "Profile", href: "/agent/profile" },
  ];

  return (
    <div className="min-h-screen bg-light flex">
      <AgentSidebar onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-30 px-4 py-3 flex items-center justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-2 z-20 relative">
            {mobileNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link
              href="/properties/new"
              onClick={() => setMenuOpen(false)}
              className="block bg-primary text-white rounded-xl px-4 py-3 text-center font-semibold text-sm"
            >
              ➕ New Listing
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleSignOut(); }}
              className="text-sm text-gray-500 hover:text-red-500 px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
