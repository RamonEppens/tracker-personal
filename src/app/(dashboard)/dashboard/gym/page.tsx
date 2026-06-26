import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Trophy, TrendingUp, Dumbbell, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function GymPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Últimas 5 sesiones
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(`
      id, date, notes, duration_minutes,
      workout_sets (
        id, reps, weight_kg,
        exercises (name, muscle_group)
      )
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  // Personal records
  const { data: prs } = await supabase
    .from("personal_records")
    .select("*, exercises(name)")
    .eq("user_id", user.id)
    .order("achieved_at", { ascending: false })
    .limit(5);

  // Sesiones esta semana
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: weekSessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .gte("date", weekAgo);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gym flex items-center gap-2">
            <Dumbbell size={20} /> Gym
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {weekSessions?.length ?? 0} sesiones esta semana
          </p>
        </div>
        <Link
          href="/dashboard/gym/new-session"
          className="flex items-center gap-2 bg-gym text-black font-medium text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nueva sesión
        </Link>
      </div>

      {/* PRs recientes */}
      {prs && prs.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <Trophy size={12} /> Personal Records
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="flex-shrink-0 bg-gym-muted border border-gym-border rounded-xl p-3 min-w-[120px]"
              >
                <p className="text-xs text-muted-foreground truncate">
                  {(pr.exercises as { name: string })?.name}
                </p>
                <p className="text-lg font-bold text-gym mt-1">{pr.weight_kg}kg</p>
                <p className="text-xs text-muted-foreground">{pr.reps} reps</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de sesiones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Calendar size={12} /> Últimas sesiones
          </h2>
          <Link href="/dashboard/gym/history" className="text-xs text-primary hover:underline">
            Ver historial →
          </Link>
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => {
              const sets = session.workout_sets as Array<{
                id: string;
                reps: number;
                weight_kg: number;
                exercises: { name: string; muscle_group: string } | null;
              }>;
              // Ejercicios únicos en esta sesión
              const exercises = [...new Set(sets?.map((s) => s.exercises?.name).filter(Boolean))];

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/gym/session/${session.id}`}
                  className="block bg-card border border-border rounded-xl p-4 hover:border-gym-border transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{formatDate(session.date, { weekday: "long", day: "numeric", month: "long" })}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sets?.length ?? 0} sets · {exercises.slice(0, 3).join(", ")}
                        {exercises.length > 3 ? ` +${exercises.length - 3}` : ""}
                      </p>
                    </div>
                    {session.duration_minutes && (
                      <span className="text-xs text-muted-foreground">
                        {session.duration_minutes}min
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <TrendingUp size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Todavía no hay sesiones</p>
            <p className="text-xs mt-1">Registrá tu primer entrenamiento</p>
            <Link
              href="/dashboard/gym/new-session"
              className="inline-block mt-4 text-xs text-gym hover:underline"
            >
              + Nueva sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
