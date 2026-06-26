import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, GraduationCap, BookOpen, Trophy } from "lucide-react";
import { TaskItem } from "@/components/tasks/TaskItem";
import type { Subject, Task } from "@/types/database";

const STATUS_CONFIG = {
  active:  { label: "Activa",    color: "text-purple-400", bg: "bg-purple-950" },
  passed:  { label: "Aprobada",  color: "text-green-400",  bg: "bg-green-950" },
  failed:  { label: "Reprobada", color: "text-red-400",    bg: "bg-red-950" },
  pending: { label: "Pendiente", color: "text-zinc-400",   bg: "bg-zinc-900" },
};

export default async function FacultyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", user.id)
    .order("status")
    .order("name");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, subjects(name)")
    .eq("user_id", user.id)
    .eq("module", "faculty")
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(20);

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id)
    .eq("module", "faculty")
    .order("created_at", { ascending: false })
    .limit(3);

  const activeSubjects = subjects?.filter((s) => s.status === "active") ?? [];
  const pending = tasks?.filter((t) => !t.done) ?? [];
  const done    = tasks?.filter((t) => t.done) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-faculty flex items-center gap-2">
            <GraduationCap size={20} /> Facultad
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeSubjects.length} {activeSubjects.length === 1 ? "materia activa" : "materias activas"}
            {pending.length > 0 && ` · ${pending.length} ${pending.length === 1 ? "tarea pendiente" : "tareas pendientes"}`}
          </p>
        </div>
        <Link
          href="/dashboard/faculty/new-task"
          className="flex items-center gap-2 bg-faculty text-white font-medium text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nueva tarea
        </Link>
      </div>

      {/* Materias */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <BookOpen size={12} /> Materias
          </h2>
          <Link href="/dashboard/faculty/subjects" className="text-xs text-purple-400 hover:underline">
            Gestionar →
          </Link>
        </div>

        {subjects && subjects.length > 0 ? (
          <div className="space-y-2">
            {subjects.map((subject) => (
              <SubjectRow key={subject.id} subject={subject as Subject} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            <GraduationCap size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin materias todavía</p>
            <Link href="/dashboard/faculty/subjects/new" className="text-xs text-purple-400 hover:underline mt-1 block">
              + Agregar materia
            </Link>
          </div>
        )}
      </div>

      {/* Tareas pendientes */}
      {(pending.length > 0 || tasks?.length === 0) && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Pendientes
          </h2>
          {pending.length > 0 ? (
            <div className="space-y-2">
              {pending.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task as Task & { subjects: { name: string } | null }}
                  accentColor="purple"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
              Sin tareas pendientes 🎉
            </p>
          )}
        </div>
      )}

      {/* Logros */}
      {achievements && achievements.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <Trophy size={12} /> Logros
          </h2>
          <div className="space-y-2">
            {achievements.map((a) => (
              <div key={a.id} className="bg-faculty-muted border border-faculty-border rounded-xl p-3">
                <p className="text-sm font-medium text-faculty">{a.title}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
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
          <div className="space-y-2">
            {done.slice(0, 5).map((task) => (
              <TaskItem
                key={task.id}
                task={task as Task & { subjects: { name: string } | null }}
                accentColor="purple"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectRow({ subject }: { subject: Subject }) {
  const status = STATUS_CONFIG[subject.status];
  const slots = Array.isArray(subject.schedule_slots)
    ? (subject.schedule_slots as Array<{ day: string; time: string }>)
    : [];

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
      <div
        className="w-2 h-10 rounded-full flex-shrink-0"
        style={{ background: subject.color || "#d946ef" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{subject.name}</p>
        {slots.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {slots.map((s) => `${s.day} ${s.time}`).join(" · ")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{subject.semester}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${status.bg} ${status.color}`}>
        {status.label}
      </span>
    </div>
  );
}
