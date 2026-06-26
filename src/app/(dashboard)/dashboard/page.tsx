import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Briefcase, GraduationCap, ChevronRight, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // ── Gym ──────────────────────────────────────
  const { data: gymSessions } = await supabase
    .from("workout_sessions")
    .select("id, date, notes")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  const lastSession = gymSessions?.[0] ?? null;
  const weekGymCount =
    gymSessions?.filter((s) => (s as any).date >= weekAgo).length ?? 0;

  // ── Work ─────────────────────────────────────
  const { data: workTasks } = await supabase
    .from("tasks")
    .select("id, title, priority, due_date, done")
    .eq("user_id", user.id)
    .eq("module", "work")
    .eq("done", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .limit(5);

  // ── Faculty ───────────────────────────────────
  const { data: facultyTasks } = await supabase
    .from("tasks")
    .select("id, title, priority, due_date, done, subjects(name)")
    .eq("user_id", user.id)
    .eq("module", "faculty")
    .eq("done", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(5);

  const { data: activeSubjects } = await supabase
    .from("subjects")
    .select("id, name, color")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(6);

  // Urgentes: vencen en ≤ 3 días
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const urgentTasks = [
    ...(workTasks ?? []),
    ...(facultyTasks ?? []),
  ].filter((t) => t.due_date && t.due_date <= in3Days) as any[];

  const userName = user.user_metadata?.full_name as string | undefined;
  const weekday = format(new Date(), "EEEE", { locale: es });

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Sección urgente ── */}
      {urgentTasks.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Próximos 3 días
          </h2>
          <div className="bg-card border border-border rounded divide-y divide-border">
            {urgentTasks.map((t) => {
              const isToday = t.due_date === today;
              return (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      t.priority === "high"
                        ? "bg-destructive"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.title}</p>
                    {t.subjects?.name && (
                      <p className="text-xs text-muted-foreground italic">{t.subjects.name}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs flex-shrink-0 font-medium ${
                      isToday ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {isToday
                      ? "Hoy"
                      : formatDate(t.due_date, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Gym ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Dumbbell size={11} strokeWidth={1.5} /> Gimnasio
          </h2>
          <Link href="/dashboard/gym" className="text-xs text-gym hover:underline flex items-center gap-0.5">
            Ver todo <ChevronRight size={11} />
          </Link>
        </div>
        <div className="bg-card border border-border rounded divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Esta semana</p>
            <p className="text-sm font-medium text-gym">
              {weekGymCount} {weekGymCount === 1 ? "sesión" : "sesiones"}
            </p>
          </div>
          {lastSession ? (
            <Link
              href={`/dashboard/gym/session/${lastSession.id}`}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors"
            >
              <div>
                <p className="text-xs text-muted-foreground">Última sesión</p>
                <p className="text-sm font-medium">{(lastSession as any).notes ?? "Sesión"}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate((lastSession as any).date, { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </Link>
          ) : (
            <Link
              href="/dashboard/gym/new-session"
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-gym hover:bg-accent/50 transition-colors"
            >
              + Registrar primera sesión
            </Link>
          )}
          <Link
            href="/dashboard/gym/new-session"
            className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            <span>Nueva sesión</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── Trabajo ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Briefcase size={11} strokeWidth={1.5} /> Trabajo
          </h2>
          <Link href="/dashboard/work" className="text-xs text-work hover:underline flex items-center gap-0.5">
            Ver todo <ChevronRight size={11} />
          </Link>
        </div>
        {workTasks && workTasks.length > 0 ? (
          <div className="bg-card border border-border rounded divide-y divide-border">
            {workTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    (t as any).priority === "high" ? "bg-destructive" : "bg-border"
                  }`}
                />
                <p className="text-sm flex-1 truncate">{(t as any).title}</p>
                {(t as any).due_date && (
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate((t as any).due_date, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            ))}
            <Link
              href="/dashboard/work/new-task"
              className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              <span>+ Nueva tarea</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded">
            <Link
              href="/dashboard/work/new-task"
              className="flex items-center justify-between px-3 py-3 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              <span>Sin tareas pendientes — agregar una</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        )}
      </section>

      {/* ── Facultad ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <GraduationCap size={11} strokeWidth={1.5} /> Facultad
          </h2>
          <Link href="/dashboard/faculty" className="text-xs text-faculty hover:underline flex items-center gap-0.5">
            Ver todo <ChevronRight size={11} />
          </Link>
        </div>
        <div className="bg-card border border-border rounded divide-y divide-border">
          {/* Materias activas */}
          {activeSubjects && activeSubjects.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
              {activeSubjects.map((s) => (
                <span
                  key={s.id}
                  className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground"
                  style={{ borderLeftColor: (s as any).color ?? "#6B3D1E", borderLeftWidth: 2 }}
                >
                  {(s as any).name}
                </span>
              ))}
            </div>
          )}

          {/* Próximas entregas */}
          {facultyTasks && facultyTasks.length > 0 ? (
            facultyTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  (t as any).priority === "high" ? "bg-destructive" : "bg-border"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{(t as any).title}</p>
                  {(t as any).subjects?.name && (
                    <p className="text-xs text-muted-foreground italic">{(t as any).subjects.name}</p>
                  )}
                </div>
                {(t as any).due_date && (
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate((t as any).due_date, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Sin entregas pendientes</p>
            </div>
          )}

          <Link
            href="/dashboard/faculty/new-task"
            className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            <span>+ Nueva tarea de facultad</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
