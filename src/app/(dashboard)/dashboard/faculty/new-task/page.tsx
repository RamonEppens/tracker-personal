"use client";

import { createTask } from "@/lib/actions/tasks";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Calendar, AlignLeft, Flag, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Subject } from "@/types/database";

const PRIORITIES = [
  { value: "high",   label: "Alta",   color: "text-red-400" },
  { value: "medium", label: "Media",  color: "text-purple-400" },
  { value: "low",    label: "Baja",   color: "text-zinc-400" },
];

export default function NewFacultyTaskPage() {
  const [pending, startTransition] = useTransition();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("subjects")
      .select("*")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setSubjects(data ?? []));
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("module", "faculty");
    startTransition(() => createTask(formData));
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/faculty"
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Nueva tarea — Facultad</h1>
          <p className="text-xs text-muted-foreground">
            Parcial, TP, entrega, estudio — lo que sea.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div className="bg-card border border-border rounded p-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Título *
          </label>
          <input
            name="title"
            required
            autoFocus
            placeholder="ej: Parcial Análisis Matemático"
            className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        {/* Materia */}
        <div className="bg-card border border-border rounded p-4 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <BookOpen size={12} /> Materia (opcional)
          </label>
          {subjects.length > 0 ? (
            <select
              name="subject_id"
              className="w-full bg-transparent text-sm text-foreground outline-none"
            >
              <option value="">Sin materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-muted-foreground">
              No tenés materias activas.{" "}
              <Link href="/dashboard/faculty/subjects/new" className="text-purple-400 hover:underline">
                Agregá una →
              </Link>
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="bg-card border border-border rounded p-4 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <AlignLeft size={12} /> Descripción (opcional)
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Temas que entran, detalles del TP, etc."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none resize-none"
          />
        </div>

        {/* Prioridad */}
        <div className="bg-card border border-border rounded p-4 space-y-3">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Flag size={12} /> Prioridad
          </label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <label key={p.value} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  defaultChecked={p.value === "medium"}
                  className="sr-only peer"
                />
                <div className={`text-center py-2 rounded-lg border border-border text-xs font-semibold transition-all peer-checked:border-purple-600 peer-checked:bg-purple-950 ${p.color}`}>
                  {p.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Fecha límite */}
        <div className="bg-card border border-border rounded p-4 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Calendar size={12} /> Fecha del parcial / entrega
          </label>
          <input
            type="date"
            name="due_date"
            className="w-full bg-transparent text-sm text-muted-foreground outline-none"
          />
          <p className="text-xs text-muted-foreground/60">
            📅 Se va a crear un evento en tu Google Calendar
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/faculty"
            className="flex-1 py-3 text-center text-sm font-medium text-muted-foreground bg-card border border-border rounded hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-3 text-sm font-semibold bg-faculty hover:opacity-90 disabled:opacity-60 text-white rounded transition-colors"
          >
            {pending ? "Guardando..." : "Guardar tarea"}
          </button>
        </div>
      </form>
    </div>
  );
}
