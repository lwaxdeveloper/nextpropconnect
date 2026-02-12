"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

const navItems = [
  { icon: "🏠", label: "Dashboard", href: "/renter" },
  { icon: "💳", label: "Payments", href: "/renter/payments" },
  { icon: "🔧", label: "Maintenance", href: "/renter/maintenance" },
  { icon: "💬", label: "Messages", href: "/renter/messages" },
  { icon: "👥", label: "Roommates", href: "/renter/roommates" },
  { icon: "📄", label: "Documents", href: "/renter/documents" },
  { icon: "🔍", label: "Find Properties", href: "/properties" },
  { icon: "❤️", label: "Saved", href: "/renter/saved" },
  { icon: "👤", label: "Profile", href: "/renter/profile" },
];

interface Props {
  isVerified: boolean;
}

export default function RenterSidebar({ isVerified }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/renter") {
      return pathname === "/renter";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-6 hidden md:flex flex-col fixed left-0 top-0 bottom-0">
      <Link href="/" className="block mb-6">
        <Logo size="sm" />
      </Link>
      
      {/* Verification Banner */}
      {!isVerified && (
        <Link 
          href="/verify"
          className="mb-4 p-3 bg-gradient-to-r from-blue-500 to-primary rounded-xl text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition"
        >
          <span className="text-lg">✓</span>
          <div>
            <p className="font-semibold">Get Verified</p>
            <p className="text-xs opacity-90">Unlock all features</p>
          </div>
        </Link>
      )}
      
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="pt-4 border-t border-gray-100 mt-4">
        {isVerified && (
          <div className="flex items-center gap-2 px-4 py-2 text-green-600 text-sm mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Verified</span>
          </div>
        )}
        <Link
          href="/api/auth/signout"
          className="text-sm text-gray-500 hover:text-red-500 transition w-full text-left px-4 py-2 block"
        >
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
