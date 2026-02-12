"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const mobileNavItems = [
  { icon: "🏠", label: "Home", href: "/renter" },
  { icon: "💳", label: "Payments", href: "/renter/payments" },
  { icon: "🔧", label: "Issues", href: "/renter/maintenance" },
  { icon: "💬", label: "Chat", href: "/renter/messages" },
  { icon: "👤", label: "Profile", href: "/renter/profile" },
];

export default function MobileNavClient() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/renter") {
      return pathname === "/renter";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
      {mobileNavItems.map((item) => (
        <Link 
          key={item.href}
          href={item.href} 
          className={`flex flex-col items-center p-2 ${
            isActive(item.href) ? "text-primary" : "text-gray-600"
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className={`text-[10px] ${isActive(item.href) ? "font-semibold" : ""}`}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
