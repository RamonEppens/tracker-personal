"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Dumbbell, Briefcase, GraduationCap, Calendar, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/dashboard/gym", label: "Gym", icon: Dumbbell, color: "text-gym" },
  { href: "/dashboard/work", label: "Trabajo", icon: Briefcase, color: "text-work" },
  { href: "/dashboard/faculty", label: "Facultad", icon: GraduationCap, color: "text-faculty" },
  { href: "/dashboard/calendar", label: "Agenda", icon: Calendar },
];

interface SidebarProps {
  userEmail?: string;
  userName?: string;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail?.[0].toUpperCase() ?? "R";

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-card border-r border-border p-4 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8 mt-2">
        <span className="text-primary text-xl font-bold">◈</span>
        <span className="font-semibold text-sm tracking-tight">Tracker Personal</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact, color }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : cn("text-muted-foreground hover:text-foreground hover:bg-accent", color)
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{userName || "Usuario"}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all w-full"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
