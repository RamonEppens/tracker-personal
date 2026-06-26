"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Briefcase, GraduationCap, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/gym", label: "Gym", icon: Dumbbell },
  { href: "/dashboard/work", label: "Trabajo", icon: Briefcase },
  { href: "/dashboard/faculty", label: "Facultad", icon: GraduationCap },
  { href: "/dashboard/calendar", label: "Agenda", icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-stretch h-16 safe-area-inset-bottom">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
                className={cn("transition-transform", isActive && "scale-110")}
              />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
