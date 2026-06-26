import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, RefreshCw, ExternalLink } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Tareas con due_date para los próximos 14 días
  const today = new Date();
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, subjects(name)")
    .eq("user_id", user.id)
    .eq("done", false)
    .gte("due_date", todayStr)
    .lte("due_date", in14days)
    .order("due_date", { ascending: true });

  // Agrupar por fecha
  const grouped: Record<string, typeof tasks> = {};
  tasks?.forEach((task) => {
    const date = task.due_date!;
    if (!grouped[date]) grouped[date] = [];
    grouped[date]!.push(task);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Calendar size={20} /> Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Próximas 2 semanas
          </p>
        </div>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink size={14} />
          Google Calendar
        </a>
      </div>

      {/* Info de sync */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-xs text-muted-foreground">
        <RefreshCw size={14} className="text-primary" />
        <span>
          Las tareas con fecha límite se sincronizan automáticamente con tu Google Calendar cuando las creás.
        </span>
      </div>

      {/* Eventos agrupados por día */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dayTasks]) => {
            const isToday = date === todayStr;
            const isTomorrow =
              date === new Date(Date.now() + 86400000).toISOString().split("T")[0];

            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isToday
                      ? "Hoy"
                      : isTomorrow
                      ? "Mañana"
                      : formatDate(date, { weekday: "long", day: "numeric", month: "short" })}
                  </div>
                </div>

                <div className="space-y-2 pl-1 border-l border-border ml-2">
                  {dayTasks?.map((task) => (
                    <div
                      key={task.id}
                      className={`ml-4 p-3 bg-card border rounded-xl border-l-4 ${
                        task.module === "work"
                          ? "border-l-work border-border"
                          : "border-l-faculty border-border"
                      }`}
                    >
                      <p className="text-sm font-medium">{task.title}</p>
                      <p
                        className={`text-xs mt-0.5 ${
                          task.module === "work" ? "text-work" : "text-faculty"
                        }`}
                      >
                        {task.module === "work" ? "Trabajo" : "Facultad"}
                        {(task as typeof task & { subjects: { name: string } | null }).subjects?.name &&
                          ` · ${(task as typeof task & { subjects: { name: string } | null }).subjects?.name}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Sin eventos próximos</p>
          <p className="text-xs mt-1">
            Las tareas con fecha límite aparecen acá automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
