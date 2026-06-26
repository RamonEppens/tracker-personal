import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Trophy, Dumbbell } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function GymPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Últimas 10 sesiones con sus series
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
    .limit(10);

  // Personal records
  const { data: prs } = await supabase
    .from("personal_records")
    .select("*, exercises(name)")
    .eq("user_id", user.id)
    .order("weight_kg", { ascending: false })
    .limit(6);

  // Sesiones últimos 7 días
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const { data: weekSessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .gte("date", weekAgo);

  return (
    <div className="max-w-2xl mx-auto space-y-7">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-xl font-semibold text-gym flex items-center gap-2">
            <Dumbbell size={18} strokeWidth={1.5} /> Gimnasio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {weekSessions?.length ?? 0} {(weekSessions?.length ?? 0) === 1 ? "sesión" : "sesiones"} esta semana
            {sessions && sessions.length > 0 && (
              <span> · última el {formatDate((sessions[0] as any).date, { day: "numeric", month: "long", year: "numeric" })}</span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/gym/new-session"
          className="flex items-center gap-2 border border-gym text-gym hover:bg-gym hover:text-white text-sm font-medium px-4 py-2 rounded transition-all"
        >
          <Plus size={14} strokeWidth={1.5} /> Nueva sesión
        </Link>
      </div>

      {/* Personal Records */}
      {prs && prs.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy size={11} strokeWidth={1.5} /> Records personales
          </h2>
          <div className="bg-card border border-border rounded divide-y divide-border">
            {prs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between px-3 py-2.5">
                <p className="text-sm text-foreground truncate flex-1">
                  {(pr.exercises as { name: string })?.name}
                </p>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className="text-sm font-semibold text-gym">{pr.weight_kg} kg</span>
                  <span className="text-xs text-muted-foreground ml-2">× {pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Historial de sesiones
        </h2>

        {sessions && sessions.length > 0 ? (
          <div className="bg-card border border-border rounded divide-y divide-border">
            {sessions.map((session) => {
              const sets = (session as any).workout_sets as Array<{
                id: string;
                reps: number;
                weight_kg: number;
                exercises: { name: string } | null;
              }>;
              const exerciseNames = [
                ...new Set(sets?.map((s) => s.exercises?.name).filter(Boolean)),
              ] as string[];
              const totalVol = sets?.reduce(
                (acc, s) => acc + s.reps * s.weight_kg, 0
              ) ?? 0;

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/gym/session/${session.id}`}
                  className="flex items-center justify-between px-3 py-3 hover:bg-accent/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {(session as any).notes ?? "Sesión"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate((session as any).date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {exerciseNames.slice(0, 3).join(" · ")}
                      {exerciseNames.length > 3 ? ` +${exerciseNames.length - 3}` : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    {totalVol > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {(totalVol / 1000).toFixed(1)} t vol.
                      </p>
                    )}
                    {(session as any).duration_minutes && (
                      <p className="text-xs text-muted-foreground">
                        {(session as any).duration_minutes} min
                      </p>
                    )}
                    <span className="text-xs text-gym opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded">
            <Dumbbell size={24} className="mx-auto mb-3 opacity-30" strokeWidth={1} />
            <p className="text-sm">Sin sesiones registradas</p>
            <Link
              href="/dashboard/gym/new-session"
              className="inline-block mt-3 text-xs text-gym hover:underline"
            >
              + Registrar primer entrenamiento
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
