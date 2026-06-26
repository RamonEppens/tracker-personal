"use client";

import { createTask } from "@/lib/actions/tasks";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, AlignLeft, Flag } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

const PRIORITIES = [
  { value: "high",   label: "Alta",   color: "text-red-400",   bg: "bg-red-950 border-red-800" },
  { value: "medium", label: "Media",  color: "text-blue-400",  bg: "bg-blue-950 border-blue-800" },
  { value: "low",    label: "Baja",   color: "text-zinc-400",  bg: "bg-zinc-900 border-zinc-700" },
];

export default function NewWorkTaskPage() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("module", "work");
    startTransition(() => createTask(formData));
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/work"
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Nueva tarea — Trabajo</h1>
          <p className="text-xs text-muted-foreground">
            Si agregás una fecha límite, se crea el evento en Google Calendar automáticamente.
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
            placeholder="ej: Revisar PR de autenticación"
            className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        {/* Descripción */}
        <div className="bg-card border border-border rounded p-4 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <AlignLeft size={12} /> Descripción (opcional)
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Detalles adicionales..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none resize-none"
          />
        </div>

        {/* Prioridad */}
        <div className="bg-card border border-border rounded p-4 space-y-3">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Flag size={11} strokeWidth={1.5} /> Prioridad
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
                <div className={`text-center py-2 rounded border text-xs transition-all peer-checked:bg-secondary peer-checked:border-foreground/30 ${p.color} border-border`}>
                  {p.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Fecha límite */}
        <div className="bg-card border border-border rounded p-4 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Calendar size={12} /> Fecha límite
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
            href="/dashboard/work"
            className="flex-1 py-2.5 text-center text-sm text-muted-foreground bg-card border border-border rounded hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-2.5 text-sm font-medium bg-work hover:opacity-90 disabled:opacity-50 text-white rounded transition-colors"
          >
            {pending ? "Guardando..." : "Guardar tarea"}
          </button>
        </div>
      </form>
    </div>
  );
}
