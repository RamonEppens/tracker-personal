import { getGreeting } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TopBarProps {
  userName?: string;
}

export function TopBar({ userName }: TopBarProps) {
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = format(today, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <header className="flex items-center justify-between px-5 py-3.5 md:px-7 border-b border-border bg-card/80">
      <div>
        <p className="text-xs text-muted-foreground capitalize tracking-wide">{dateStr}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">
          {greeting}, {userName?.split(" ")[0] || "Ramón"}
        </p>
      </div>
    </header>
  );
}
