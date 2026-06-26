import { getGreeting, getDayName } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TopBarProps {
  userName?: string;
}

export function TopBar({ userName }: TopBarProps) {
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = format(today, "d 'de' MMMM", { locale: es });

  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm">
      <div>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        <h1 className="text-base font-semibold">
          {greeting}, {userName?.split(" ")[0] || "Ramón"} 👋
        </h1>
      </div>
      {/* Espacio para futuras acciones globales (notificaciones, etc.) */}
      <div />
    </header>
  );
}
