"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Star, Briefcase, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "chat", label: "Chat IA", icon: MessageCircle },
  { segment: "favoritos", label: "Favoritos", icon: Star },
  { segment: "reservas", label: "Reservas", icon: Briefcase },
  { segment: "vuelos", label: "Vuelos", icon: Plane },
];

export function TripTabs({ viajeId }: { viajeId: string }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-stone-200 px-3 sm:px-6">
      {TABS.map(({ segment, label, icon: Icon }) => {
        const href = `/viaje/${viajeId}/${segment}`;
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={segment}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-brand text-brand-dark"
                : "border-transparent text-stone-500 hover:text-stone-900"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
