"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Briefcase, GraduationCap, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",          label: "Inicio",   icon: Home },
  { href: "/dashboard/gym",      label: "Gym",      icon: Dumbbell },
  { href: "/dashboard/work",     label: "Trabajo",  icon: Briefcase },
  { href: "/dashboard/faculty",  label: "Facultad", icon: GraduationCap },
  { href: "/dashboard/calendar", label: "Agenda",   icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-leather-dark border-t border-leather-light/20 md:hidden">
      <div className="flex items-stretch h-14">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-leather-active" : "text-leather-muted"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
