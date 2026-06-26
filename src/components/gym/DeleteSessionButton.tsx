"use client";

import { deleteWorkoutSession } from "@/lib/actions/gym";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta sesión? No se puede deshacer.")) return;
    startTransition(() => deleteWorkoutSession(sessionId));
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`p-2 rounded text-muted-foreground hover:text-destructive transition-colors ${pending ? "opacity-50" : ""}`}
    >
      <Trash2 size={15} strokeWidth={1.5} />
    </button>
  );
}
