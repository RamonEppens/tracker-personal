"use client";

import { toggleTask, deleteTask } from "@/lib/actions/tasks";
import { useTransition } from "react";
import { Calendar, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types/database";

const PRIORITY_LABEL = {
  high:   { label: "Alta",  color: "text-red-400 bg-red-950" },
  medium: { label: "Media", color: "text-blue-400 bg-blue-950" },
  low:    { label: "Baja",  color: "text-zinc-400 bg-zinc-800" },
};

interface TaskItemProps {
  task: Task & { subjects?: { name: string } | null };
  accentColor?: string; // "blue" | "purple"
}

export function TaskItem({ task, accentColor = "blue" }: TaskItemProps) {
  const [pending, startTransition] = useTransition();
  const p = PRIORITY_LABEL[task.priority];
  const checkColor = accentColor === "purple" ? "bg-purple-500 border-purple-500" : "bg-blue-500 border-blue-500";

  function handleToggle() {
    startTransition(() => toggleTask(task.id, !task.done));
  }

  function handleDelete() {
    if (!confirm("¿Eliminar esta tarea?")) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-card border border-border rounded-xl transition-opacity ${
        pending ? "opacity-50" : ""
      } ${task.done ? "opacity-60" : ""}`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          task.done ? checkColor : "border-border hover:border-zinc-500"
        }`}
      >
        {task.done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.subjects?.name && (
            <span className="text-xs text-muted-foreground">{task.subjects.name}</span>
          )}
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Calendar size={10} />
              {formatDate(task.due_date, { day: "numeric", month: "short" })}
            </span>
          )}
          {task.google_event_id && (
            <span className="text-xs text-muted-foreground">📅</span>
          )}
        </div>
      </div>

      {/* Prioridad */}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${p.color}`}>
        {p.label}
      </span>

      {/* Borrar */}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
