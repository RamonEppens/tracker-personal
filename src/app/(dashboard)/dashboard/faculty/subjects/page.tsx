import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { SubjectStatusButton } from "@/components/tasks/SubjectStatusButton";
import { DeleteSubjectButton } from "@/components/tasks/DeleteSubjectButton";
import type { Subject } from "@/types/database";

const STATUS = {
  active:  { label: "Activa",    color: "text-purple-400",  bg: "bg-purple-950 border-purple-700" },
  passed:  { label: "Aprobada",  color: "text-green-400",   bg: "bg-green-950 border-green-700" },
  failed:  { label: "Reprobada", color: "text-red-400",     bg: "bg-red-950 border-red-700" },
  pending: { label: "Pendiente", color: "text-zinc-400",    bg: "bg-zinc-900 border-zinc-700" },
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", user.id)
    .order("status")
    .order("name");

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/faculty"
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold">Materias</h1>
        </div>
        <Link
          href="/dashboard/faculty/subjects/new"
          className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Agregar
        </Link>
      </div>

      {subjects && subjects.length > 0 ? (
        <div className="space-y-3">
          {subjects.map((subject) => {
            const s = STATUS[subject.status as keyof typeof STATUS];
            const slots = Array.isArray(subject.schedule_slots)
              ? (subject.schedule_slots as Array<{ day: string; time: string }>)
              : [];

            return (
              <div key={subject.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ background: subject.color || "#d946ef" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{subject.semester}</p>
                      {slots.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {slots.map((sl) => `${sl.day} ${sl.time}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SubjectStatusButton subject={subject as Subject} />
                    <DeleteSubjectButton subjectId={subject.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="text-sm font-medium">Sin materias todavía</p>
          <Link
            href="/dashboard/faculty/subjects/new"
            className="text-xs text-purple-400 hover:underline mt-2 block"
          >
            + Agregar primera materia
          </Link>
        </div>
      )}
    </div>
  );
}
