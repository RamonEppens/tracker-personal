import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DeleteSessionButton } from "@/components/gym/DeleteSessionButton";

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("workout_sessions")
    .select(`
      id, date, notes, duration_minutes,
      workout_sets (
        id, set_number, reps, weight_kg, notes,
        exercises (id, name, muscle_group)
      )
    `)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  // Agrupar series por ejercicio
  const sets = (session as any).workout_sets as Array<{
    id: string;
    set_number: number;
    reps: number;
    weight_kg: number;
    notes: string | null;
    exercises: { id: string; name: string; muscle_group: string } | null;
  }>;

  const byExercise = sets.reduce(
    (acc, s) => {
      const key = s.exercises?.id ?? "unknown";
      if (!acc[key]) acc[key] = { name: s.exercises?.name ?? "—", sets: [] };
      acc[key].sets.push(s);
      return acc;
    },
    {} as Record<string, { name: string; sets: typeof sets }>
  );

  const totalVolume = sets.reduce((acc, s) => acc + s.reps * s.weight_kg, 0);
  const totalSets   = sets.length;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/gym"
          className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-lg font-semibold truncate">
            {(session as any).notes ?? "Sesión"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate((session as any).date, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {(session as any).duration_minutes
              ? ` · ${(session as any).duration_minutes} min`
              : ""}
          </p>
        </div>
        <DeleteSessionButton sessionId={params.id} />
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Ejercicios", value: Object.keys(byExercise).length },
          { label: "Series",     value: totalSets },
          {
            label: "Volumen",
            value:
              totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)} t`
                : `${totalVolume} kg`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded p-3 text-center">
            <p className="text-lg font-semibold text-gym">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Ejercicios */}
      <div className="space-y-4">
        {Object.entries(byExercise).map(([exId, { name, sets: exSets }]) => {
          const bestSet = exSets.reduce(
            (best, s) => (s.weight_kg > (best?.weight_kg ?? 0) ? s : best),
            exSets[0]
          );

          return (
            <div key={exId} className="bg-card border border-border rounded">
              {/* Nombre del ejercicio */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <p className="text-sm font-medium">{name}</p>
                <span className="text-xs text-muted-foreground">
                  mejor: {bestSet.weight_kg} kg × {bestSet.reps}
                </span>
              </div>

              {/* Tabla de series */}
              <div className="divide-y divide-border">
                <div className="grid grid-cols-4 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Serie</span>
                  <span className="text-center">Peso</span>
                  <span className="text-center">Reps</span>
                  <span className="text-right">Vol.</span>
                </div>
                {exSets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-4 px-3 py-2 text-sm items-center"
                    >
                      <span className="text-muted-foreground text-xs">{s.set_number}</span>
                      <span className="text-center font-medium">
                        {s.weight_kg > 0 ? `${s.weight_kg} kg` : "—"}
                      </span>
                      <span className="text-center">{s.reps}</span>
                      <span className="text-right text-xs text-muted-foreground">
                        {(s.reps * s.weight_kg).toFixed(0)} kg
                      </span>
                    </div>
                  ))}
                {/* Nota del ejercicio si existe */}
                {exSets.some((s) => s.notes) && (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">
                    {exSets.find((s) => s.notes)?.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
