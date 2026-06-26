"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Dumbbell, Briefcase, GraduationCap, Calendar, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard",          label: "Inicio",    icon: Home,          exact: true },
  { href: "/dashboard/gym",      label: "Gimnasio",  icon: Dumbbell },
  { href: "/dashboard/work",     label: "Trabajo",   icon: Briefcase },
  { href: "/dashboard/faculty",  label: "Facultad",  icon: GraduationCap },
  { href: "/dashboard/calendar", label: "Agenda",    icon: Calendar },
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
    <aside className="hidden md:flex flex-col w-52 min-h-screen bg-leather-dark border-r border-leather-light/20 p-5 fixed left-0 top-0">
      {/* Título — estilo cuaderno */}
      <div className="px-1 mb-8 mt-1">
        <p className="font-playfair text-leather-active text-base font-semibold leading-tight">
          Tracker
        </p>
        <p className="text-leather-muted text-xs tracking-widest uppercase mt-0.5">
          Personal
        </p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150",
                isActive
                  ? "text-leather-active bg-leather-light/30"
                  : "text-leather-muted hover:text-leather-text hover:bg-leather-light/20"
              )}
            >
              <Icon
                size={15}
                strokeWidth={isActive ? 2 : 1.5}
                className="flex-shrink-0"
              />
              <span className={cn("tracking-wide", isActive && "font-medium")}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer de usuario */}
      <div className="border-t border-leather-light/20 pt-4 mt-4 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-7 h-7 rounded-full bg-leather-light flex items-center justify-center text-leather-active text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-leather-text truncate">
              {userName?.split(" ")[0] || "Usuario"}
            </p>
            <p className="text-xs text-leather-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded text-xs text-leather-muted hover:text-leather-text hover:bg-leather-light/20 transition-all w-full"
        >
          <LogOut size={13} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
