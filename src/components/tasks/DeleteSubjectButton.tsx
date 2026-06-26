"use client";

import { deleteSubject } from "@/lib/actions/subjects";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteSubjectButton({ subjectId }: { subjectId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta materia? Se van a desvincular las tareas asociadas.")) return;
    startTransition(() => deleteSubject(subjectId));
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`p-1.5 text-muted-foreground hover:text-red-400 transition-colors ${pending ? "opacity-50" : ""}`}
    >
      <Trash2 size={14} />
    </button>
  );
}
