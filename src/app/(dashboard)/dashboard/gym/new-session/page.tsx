"use client";

import { createWorkoutSession } from "@/lib/actions/gym";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Plus, Minus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Tipos ─────────────────────────────────────────
interface RoutineDay {
  id: string;
  name: string;
  day_number: number;
}

interface RoutineExercise {
  id: string;
  exercise_order: number;
  target_sets: number | null;
  reps_scheme: string | null;
  reference_weight: string | null;
  notes: string | null;
  exercises: {
    id: string;
    name: string;
    muscle_group: string;
  };
}

interface SetEntry {
  reps: string;
  weightKg: string;
  notes: string;
}

// Días del hardcode por si la rutina no está sembrada
const FALLBACK_DAYS = [
  { id: "core",  name: "Core",                       day_number: 0 },
  { id: "dia1",  name: "Día 1 — Espalda + Bíceps",   day_number: 1 },
  { id: "dia2",  name: "Día 2 — Piernas",             day_number: 2 },
  { id: "dia3",  name: "Día 3 — Pecho + Tríceps + Hombro", day_number: 3 },
];

// ── Componente ────────────────────────────────────
export default function NewSessionPage() {
  const [pending, startTransition] = useTransition();
  const supabase = createClient();

  const [step, setStep]               = useState<"day" | "sets">("day");
  const [days, setDays]               = useState<RoutineDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [exercises, setExercises]     = useState<RoutineExercise[]>([]);
  const [sets, setSets]               = useState<Record<string, SetEntry[]>>({});
  const [date, setDate]               = useState(format(new Date(), "yyyy-MM-dd"));
  const [duration, setDuration]       = useState("");
  const [loadingEx, setLoadingEx]     = useState(false);

  // Cargar días de la rutina
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("routine_days")
        .select("id, name, day_number, routines!inner(user_id)")
        .eq("routines.user_id", user.id)
        .order("day_number");

      setDays(data && data.length > 0 ? data : FALLBACK_DAYS);
    });
  }, []);

  // Cargar ejercicios al seleccionar día
  async function selectDay(day: RoutineDay) {
    setSelectedDay(day);
    setLoadingEx(true);
    setSets({});

    const { data } = await supabase
      .from("routine_day_exercises")
      .select(`
        id, exercise_order, target_sets, reps_scheme, reference_weight, notes,
        exercises (id, name, muscle_group)
      `)
      .eq("routine_day_id", day.id)
      .order("exercise_order");

    if (data && data.length > 0) {
      setExercises(data as unknown as RoutineExercise[]);
      // Pre-cargar sets vacíos según target_sets
      const initial: Record<string, SetEntry[]> = {};
      for (const ex of data as unknown as RoutineExercise[]) {
        const count = ex.target_sets ?? 3;
        initial[ex.exercises.id] = Array.from({ length: count }, () => ({
          reps: "", weightKg: ex.reference_weight?.replace(/[^0-9.]/g, "") ?? "", notes: "",
        }));
      }
      setSets(initial);
    } else {
      // Sin rutina — dejar ejercicios vacíos para agregar manualmente
      setExercises([]);
    }

    setLoadingEx(false);
    setStep("sets");
  }

  // Manejo de sets
  function updateSet(exerciseId: string, idx: number, field: keyof SetEntry, value: string) {
    setSets((prev) => {
      const updated = [...(prev[exerciseId] ?? [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, [exerciseId]: updated };
    });
  }

  function addSet(exerciseId: string, referenceWeight?: string) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: [
        ...(prev[exerciseId] ?? []),
        { reps: "", weightKg: referenceWeight?.replace(/[^0-9.]/g, "") ?? "", notes: "" },
      ],
    }));
  }

  function removeSet(exerciseId: string, idx: number) {
    setSets((prev) => {
      const updated = [...(prev[exerciseId] ?? [])];
      updated.splice(idx, 1);
      return { ...prev, [exerciseId]: updated };
    });
  }

  // Guardar sesión
  function handleSave() {
    if (!selectedDay) return;

    const allSets: Array<{
      exerciseId: string;
      setNumber: number;
      reps: number;
      weightKg: number;
      notes?: string;
    }> = [];

    for (const ex of exercises) {
      const exSets = sets[ex.exercises.id] ?? [];
      exSets.forEach((s, i) => {
        const reps = parseInt(s.reps);
        const weight = parseFloat(s.weightKg);
        if (reps > 0) {
          allSets.push({
            exerciseId: ex.exercises.id,
            setNumber:  i + 1,
            reps,
            weightKg:   isNaN(weight) ? 0 : weight,
            notes:      s.notes || undefined,
          });
        }
      });
    }

    startTransition(() =>
      createWorkoutSession({
        dayName:         selectedDay.name,
        date,
        durationMinutes: duration ? parseInt(duration) : undefined,
        sets:            allSets,
      })
    );
  }

  const totalSetsLogged = Object.values(sets)
    .flat()
    .filter((s) => parseInt(s.reps) > 0).length;

  // ── PASO 1: Selección de día ──────────────────
  if (step === "day") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/gym" className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-playfair text-lg font-semibold">Nueva sesión</h1>
            <p className="text-xs text-muted-foreground">¿Qué día entrenás hoy?</p>
          </div>
        </div>

        {/* Fecha */}
        <div className="bg-card border border-border rounded p-4 mb-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm text-foreground outline-none w-full"
          />
        </div>

        {/* Días */}
        <div className="bg-card border border-border rounded divide-y divide-border">
          {(days.length > 0 ? days : FALLBACK_DAYS).map((day) => (
            <button
              key={day.id}
              onClick={() => selectDay(day)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors text-left"
            >
              <span className="text-sm font-medium">{day.name}</span>
              <ChevronRight size={15} className="text-muted-foreground" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── PASO 2: Log de series ──────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setStep("day")}
          className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-lg font-semibold truncate">{selectedDay?.name}</h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(date + "T12:00:00"), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {loadingEx ? (
        <p className="text-sm text-muted-foreground text-center py-10">Cargando ejercicios...</p>
      ) : (
        <div className="space-y-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-card border border-border rounded">
              {/* Encabezado del ejercicio */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium">{ex.exercises.name}</p>
                <div className="flex gap-3 mt-0.5">
                  {ex.reps_scheme && (
                    <span className="text-xs text-muted-foreground">{ex.reps_scheme} reps</span>
                  )}
                  {ex.reference_weight && (
                    <span className="text-xs text-muted-foreground">ref. {ex.reference_weight}</span>
                  )}
                </div>
              </div>

              {/* Series */}
              <div className="divide-y divide-border">
                {(sets[ex.exercises.id] ?? []).map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="kg"
                        value={s.weightKg}
                        onChange={(e) => updateSet(ex.exercises.id, idx, "weightKg", e.target.value)}
                        className="w-16 text-sm text-center bg-muted/50 border border-border rounded px-2 py-1 outline-none"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="reps"
                        value={s.reps}
                        onChange={(e) => updateSet(ex.exercises.id, idx, "reps", e.target.value)}
                        className="w-16 text-sm text-center bg-muted/50 border border-border rounded px-2 py-1 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="nota"
                      value={s.notes}
                      onChange={(e) => updateSet(ex.exercises.id, idx, "notes", e.target.value)}
                      className="flex-1 text-xs bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/40"
                    />
                    <button
                      onClick={() => removeSet(ex.exercises.id, idx)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Agregar serie */}
              <button
                onClick={() => addSet(ex.exercises.id, ex.reference_weight ?? "")}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors border-t border-border"
              >
                <Plus size={11} /> Agregar serie
              </button>
            </div>
          ))}

          {/* Duración */}
          <div className="bg-card border border-border rounded p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              Duración (opcional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-20 text-sm text-center bg-muted/50 border border-border rounded px-2 py-1 outline-none"
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pb-4">
            <Link
              href="/dashboard/gym"
              className="flex-1 py-2.5 text-center text-sm text-muted-foreground bg-card border border-border rounded hover:bg-accent transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={pending || totalSetsLogged === 0}
              className="flex-1 py-2.5 text-sm font-medium bg-gym hover:opacity-90 disabled:opacity-50 text-white rounded transition-colors"
            >
              {pending ? "Guardando..." : `Guardar sesión (${totalSetsLogged} series)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
