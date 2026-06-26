"use client";

import { updateSubjectStatus } from "@/lib/actions/subjects";
import { useTransition } from "react";
import type { Subject } from "@/types/database";

const STATUS_CYCLE: Array<Subject["status"]> = ["active", "passed", "failed", "pending"];
const STATUS_CONFIG = {
  active:  { label: "Activa",    color: "text-purple-400 bg-purple-950 border-purple-700" },
  passed:  { label: "Aprobada",  color: "text-green-400 bg-green-950 border-green-700" },
  failed:  { label: "Reprobada", color: "text-red-400 bg-red-950 border-red-700" },
  pending: { label: "Pendiente", color: "text-zinc-400 bg-zinc-900 border-zinc-700" },
};

export function SubjectStatusButton({ subject }: { subject: Subject }) {
  const [pending, startTransition] = useTransition();
  const current = subject.status as Subject["status"];
  const config = STATUS_CONFIG[current];

  function handleClick() {
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
    const next = STATUS_CYCLE[nextIdx];
    startTransition(() => updateSubjectStatus(subject.id, next));
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title="Click para cambiar estado"
      className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-opacity ${config.color} ${pending ? "opacity-50" : ""}`}
    >
      {config.label}
    </button>
  );
}
