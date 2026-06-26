import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Briefcase, GraduationCap, Calendar, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cargar tareas pendientes del día
  const today = new Date().toISOString().split("T")[0];
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("done", false)
    .order("due_date", { ascending: true })
    .limit(5);

  // Cargar sesiones de gym de la semana
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", user.id)
    .gte("date", weekAgo);

  const gymDaysThisWeek = sessions?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          value={`${tasks?.length ?? 0}`}
          label="Tareas pendientes"
          icon={<CheckCircle2 size={14} />}
          color="text-foreground"
        />
        <StatCard
          value={`${gymDaysThisWeek}/sem`}
          label="Días de gym"
          icon={<Dumbbell size={14} />}
          color="text-gym"
        />
        <StatCard
          value="Hoy"
          label={new Date().toLocaleDateString("es-AR", { weekday: "long" })}
          icon={<Clock size={14} />}
          color="text-primary"
          capitalize
        />
      </div>

      {/* Accesos rápidos a módulos */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Módulos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ModuleCard
            href="/dashboard/gym"
            icon={<Dumbbell size={20} />}
            title="Gym"
            description="Rutina, pesos y progresión"
            color="text-gym"
            bg="bg-gym-muted"
            border="border-gym-border"
          />
          <ModuleCard
            href="/dashboard/work"
            icon={<Briefcase size={20} />}
            title="Trabajo"
            description="Tareas y reuniones"
            color="text-work"
            bg="bg-work-muted"
            border="border-work-border"
          />
          <ModuleCard
            href="/dashboard/faculty"
            icon={<GraduationCap size={20} />}
            title="Facultad"
            description="Materias y parciales"
            color="text-faculty"
            bg="bg-faculty-muted"
            border="border-faculty-border"
          />
          <ModuleCard
            href="/dashboard/calendar"
            icon={<Calendar size={20} />}
            title="Agenda"
            description="Sincronizado con Google"
            color="text-primary"
            bg="bg-primary/10"
            border="border-primary/20"
          />
        </div>
      </div>

      {/* Tareas pendientes */}
      {tasks && tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pendientes
            </h2>
            <Link href="/dashboard/work" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
              >
                <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{task.title}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    task.module === "work"
                      ? "bg-work-muted text-work"
                      : "bg-faculty-muted text-faculty"
                  }`}
                >
                  {task.module === "work" ? "Trabajo" : "Facultad"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío: primera vez */}
      {(!tasks || tasks.length === 0) && gymDaysThisWeek === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Todo listo para empezar</p>
          <p className="text-xs mt-1">
            Andá a <Link href="/dashboard/gym" className="text-primary hover:underline">Gym</Link> para cargar tu primera rutina, o a{" "}
            <Link href="/dashboard/work" className="text-primary hover:underline">Trabajo</Link> para agregar tareas.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
  capitalize,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  capitalize?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1">
      <div className={`flex items-center gap-1 text-xs text-muted-foreground`}>
        {icon}
        {label}
      </div>
      <p className={`text-lg font-bold ${color} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  description,
  color,
  bg,
  border,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 p-4 rounded-xl border ${bg} ${border} hover:opacity-80 transition-opacity`}
    >
      <div className={color}>{icon}</div>
      <div>
        <p className={`text-sm font-semibold ${color}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
