import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExerciseProgressChart } from "@/components/gym/ExerciseProgressChart";

export default async function GymProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Todas las series con fecha de sesión
  const { data: sets } = await supabase
    .from("workout_sets")
    .select(`
      reps, weight_kg,
      exercises (id, name, muscle_group),
      workout_sessions!inner (date, user_id)
    `)
    .eq("workout_sessions.user_id", user.id)
    .gt("weight_kg", 0)
    .order("workout_sessions(date)", { ascending: true });

  if (!sets || sets.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/gym" className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-playfair text-lg font-semibold">Progreso</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center py-12 border border-dashed border-border rounded">
          Registrá más sesiones para ver el progreso por ejercicio.
        </p>
      </div>
    );
  }

  // Agrupar por ejercicio → por fecha → mejor peso de la sesión
  const byExercise: Record<
    string,
    { name: string; muscle_group: string; byDate: Record<string, { bestWeight: number; bestReps: number }> }
  > = {};

  for (const s of sets as any[]) {
    const exId   = s.exercises?.id;
    const exName = s.exercises?.name;
    const exMg   = s.exercises?.muscle_group;
    const date   = s.workout_sessions?.date;
    if (!exId || !date) continue;

    if (!byExercise[exId]) {
      byExercise[exId] = { name: exName, muscle_group: exMg, byDate: {} };
    }
    const existing = byExercise[exId].byDate[date];
    if (!existing || s.weight_kg > existing.bestWeight) {
      byExercise[exId].byDate[date] = {
        bestWeight: s.weight_kg,
        bestReps:   s.reps,
      };
    }
  }

  // Ordenar ejercicios por grupo muscular
  const muscleOrder = ["back", "legs", "chest", "arms", "shoulders", "core"];
  const exercises = Object.entries(byExercise)
    .map(([id, val]) => ({
      id,
      ...val,
      data: Object.entries(val.byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({ date, ...d })),
    }))
    .sort((a, b) => {
      const ia = muscleOrder.indexOf(a.muscle_group);
      const ib = muscleOrder.indexOf(b.muscle_group);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  // Grupo muscular → etiqueta en español
  const muscleLabel: Record<string, string> = {
    back:      "Espalda",
    legs:      "Piernas",
    chest:     "Pecho",
    arms:      "Brazos",
    shoulders: "Hombros",
    core:      "Core",
  };

  // Agrupar ejercicios por grupo muscular para mostrar
  const grouped: Record<string, typeof exercises> = {};
  for (const ex of exercises) {
    const g = muscleLabel[ex.muscle_group] ?? "Otros";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(ex);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/gym" className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-playfair text-lg font-semibold">Progreso</h1>
          <p className="text-xs text-muted-foreground">Mejor peso por sesión, por ejercicio</p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([group, exs]) => (
          <section key={group}>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {group}
            </h2>
            <div className="space-y-4">
              {exs.map((ex) => (
                <div key={ex.id} className="bg-card border border-border rounded">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <p className="text-sm font-medium">{ex.name}</p>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gym">
                        {ex.data[ex.data.length - 1]?.bestWeight} kg
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        mejor actual
                      </span>
                    </div>
                  </div>
                  <div className="px-2 pt-2 pb-3">
                    <ExerciseProgressChart
                      exerciseName={ex.name}
                      data={ex.data}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
