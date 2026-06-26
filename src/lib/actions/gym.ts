"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────
// Crear sesión de entrenamiento con sus series
// ─────────────────────────────────────────────
export async function createWorkoutSession(data: {
  dayName: string;
  date: string;
  durationMinutes?: number;
  notes?: string;
  sets: Array<{
    exerciseId: string;
    setNumber: number;
    reps: number;
    weightKg: number;
    notes?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Crear sesión
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id:          user.id,
      date:             data.date,
      duration_minutes: data.durationMinutes ?? null,
      notes:            data.dayName,
    })
    .select("id")
    .single();

  if (sessionError || !session) throw new Error(sessionError?.message ?? "Error al crear sesión");

  // 2. Insertar series
  if (data.sets.length > 0) {
    const { error: setsError } = await supabase.from("workout_sets").insert(
      data.sets.map((s) => ({
        session_id:  session.id,
        exercise_id: s.exerciseId,
        set_number:  s.setNumber,
        reps:        s.reps,
        weight_kg:   s.weightKg,
        notes:       s.notes ?? null,
      }))
    );
    if (setsError) throw new Error(setsError.message);
  }

  revalidatePath("/dashboard/gym");
  redirect(`/dashboard/gym/session/${session.id}`);
}

// ─────────────────────────────────────────────
// Eliminar sesión
// ─────────────────────────────────────────────
export async function deleteWorkoutSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("workout_sets")
    .delete()
    .eq("session_id", sessionId);

  await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/gym");
  redirect("/dashboard/gym");
}
