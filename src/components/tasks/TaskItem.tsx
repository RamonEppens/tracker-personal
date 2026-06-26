"use client";

import { toggleTask, deleteTask } from "@/lib/actions/tasks";
import { useTransition } from "react";
import { Calendar, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types/database";

const PRIORITY = {
  high:   { label: "Alta",  dot: "bg-destructive" },
  medium: { label: "Media", dot: "bg-muted-foreground" },
  low:    { label: "Baja",  dot: "bg-border" },
};

interface TaskItemProps {
  task: Task & { subjects?: { name: string } | null };
  accentColor?: "work" | "faculty" | "gym";
}

export function TaskItem({ task, accentColor = "work" }: TaskItemProps) {
  const [pending, startTransition] = useTransition();
  const p = PRIORITY[task.priority];

  const checkDone =
    accentColor === "faculty" ? "border-faculty bg-faculty"
    : accentColor === "gym"   ? "border-gym bg-gym"
    :                           "border-work bg-work";

  function handleToggle() {
    startTransition(() => toggleTask(task.id, !task.done));
  }

  function handleDelete() {
    if (!confirm("¿Eliminar esta tarea?")) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div
      className={`group flex items-start gap-3 py-2.5 px-3 border-b border-border last:border-b-0 transition-opacity ${
        pending ? "opacity-40" : ""
      }`}
    >
      {/* Checkbox cuadrado — estilo casilla de cuaderno */}
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`mt-0.5 w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all ${
          task.done
            ? `${checkDone} border-transparent`
            : "border-border hover:border-muted-foreground bg-transparent"
        }`}
      >
        {task.done && (
          <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
            <path d="M1 3.5l2 2L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${
          task.done ? "line-through text-muted-foreground" : "text-foreground"
        }`}>
          {task.title}
        </p>

        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {task.subjects?.name && (
            <span className="text-xs text-muted-foreground italic">{task.subjects.name}</span>
          )}
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={9} strokeWidth={1.5} />
              {formatDate(task.due_date, { day: "numeric", month: "short" })}
              {task.google_event_id && " · cal"}
            </span>
          )}
          <span className={`text-[10px] uppercase tracking-wider flex items-center gap-1 text-muted-foreground`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.dot}`} />
            {p.label}
          </span>
        </div>
      </div>

      {/* Borrar — visible al hacer hover */}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="mt-0.5 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
      >
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}
