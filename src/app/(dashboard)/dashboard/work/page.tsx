import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Briefcase, Trophy } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TaskItem } from "@/components/tasks/TaskItem";
import type { Task } from "@/types/database";

export default async function WorkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("module", "work")
    .order("done", { ascending: true })
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id)
    .eq("module", "work")
    .order("created_at", { ascending: false })
    .limit(3);

  const pending = tasks?.filter((t) => !t.done) ?? [];
  const done    = tasks?.filter((t) => t.done) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-work flex items-center gap-2">
            <Briefcase size={20} /> Trabajo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pending.length} {pending.length === 1 ? "tarea pendiente" : "tareas pendientes"}
          </p>
        </div>
        <Link
          href="/dashboard/work/new-task"
          className="flex items-center gap-2 border border-work text-work hover:bg-work hover:text-white font-medium text-sm px-4 py-2 rounded transition-all"
        >
          <Plus size={14} strokeWidth={1.5} /> Nueva tarea
        </Link>
      </div>

      {/* Pendientes */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Pendientes
        </h2>
        {pending.length > 0 ? (
          <div className="bg-card border border-border rounded divide-y divide-border">
            {pending.map((task) => (
              <TaskItem key={task.id} task={task as Task} accentColor="work" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-5 text-center border border-dashed border-border rounded">
            Sin tareas pendientes
          </p>
        )}
      </div>

      {/* Logros */}
      {achievements && achievements.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy size={11} strokeWidth={1.5} /> Logros recientes
          </h2>
          <div className="bg-work-muted border border-work-border rounded divide-y divide-work-border">
            {achievements.map((a) => (
              <div key={a.id} className="px-3 py-2.5">
                <p className="text-sm font-medium text-work">{a.title}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(a.created_at, { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completadas */}
      {done.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Completadas
          </h2>
          <div className="bg-card border border-border rounded divide-y divide-border opacity-70">
            {done.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task as Task} accentColor="work" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
