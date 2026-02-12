"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

interface AgentInfo {
  hasAgency: boolean;
  isAgencyOwner: boolean;
}

const baseNavItems = [
  { icon: "📊", label: "Overview", href: "/agent" },
  { icon: "🏠", label: "My Listings", href: "/agent/properties" },
  { icon: "🔑", label: "Rentals", href: "/agent/rentals", highlight: true },
  { icon: "👥", label: "Leads", href: "/agent/leads" },
  { icon: "💬", label: "Messages", href: "/agent/messages" },
  { icon: "📲", label: "WhatsApp", href: "/agent/conversations" },
  { icon: "📢", label: "Bulk Message", href: "/agent/bulk-message" },
  { icon: "📈", label: "Analytics", href: "/agent/analytics" },
  { icon: "⭐", label: "Reviews", href: "/agent/reviews" },
  { icon: "💰", label: "Commissions", href: "/agent/commissions" },
  { icon: "📱", label: "Social Posts", href: "/agent/social" },
  { icon: "🖼️", label: "Flyers", href: "/agent/flyer" },
  { icon: "⚡", label: "Templates", href: "/agent/templates" },
];

const agencyNavItems = [
  { icon: "🏢", label: "Team", href: "/agent/team" },
];

const bottomNavItems = [
  { icon: "💳", label: "Billing", href: "/agent/billing" },
  { icon: "👤", label: "Profile", href: "/agent/profile" },
];

export default function AgentSidebar({ onSignOut }: { onSignOut?: () => void }) {
  const pathname = usePathname();
  const [agentInfo, setAgentInfo] = useState<AgentInfo>({ hasAgency: false, isAgencyOwner: false });

  useEffect(() => {
    // Fetch agent info to determine if they have a team
    fetch('/api/agent/info')
      .then(r => r.ok ? r.json() : { hasAgency: false, isAgencyOwner: false })
      .then(data => setAgentInfo(data))
      .catch(() => {});
  }, []);

  // Build nav items based on permissions
  const navItems = [
    ...baseNavItems,
    ...(agentInfo.isAgencyOwner ? agencyNavItems : []),
    ...bottomNavItems,
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-6 hidden md:flex flex-col">
      <Link href="/" className="block mb-8">
        <Logo size="sm" />
      </Link>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = item.href === "/agent" 
            ? pathname === "/agent" 
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t border-gray-100 mt-4">
        <Link
          href="/properties/new"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition mb-3"
        >
          ➕ New Listing
        </Link>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="text-sm text-gray-500 hover:text-red-500 transition w-full text-left px-4"
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
