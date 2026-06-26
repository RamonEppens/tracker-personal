"use client";

import { createSubject } from "@/lib/actions/subjects";
import { useTransition, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#d946ef", "#a78bfa", "#60a5fa", "#34d399",
  "#fb923c", "#f43f5e", "#facc15", "#94a3b8",
];

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function NewSubjectPage() {
  const [pending, startTransition] = useTransition();
  const [color, setColor] = useState(COLORS[0]);
  const [slots, setSlots] = useState([{ day: "Lun", time: "" }]);

  function addSlot() {
    setSlots((s) => [...s, { day: "Lun", time: "" }]);
  }
  function removeSlot(i: number) {
    setSlots((s) => s.filter((_, idx) => idx !== i));
  }
  function updateSlot(i: number, field: "day" | "time", value: string) {
    setSlots((s) => s.map((sl, idx) => idx === i ? { ...sl, [field]: value } : sl));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("color", color);
    startTransition(() => createSubject(formData));
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/faculty/subjects"
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold">Agregar materia</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Nombre *
          </label>
          <input
            name="name"
            required
            autoFocus
            placeholder="ej: Análisis Matemático I"
            className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        {/* Cuatrimestre */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Cuatrimestre / Año
          </label>
          <input
            name="semester"
            placeholder="ej: 1C 2025"
            defaultValue="1C 2025"
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        {/* Color */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  background: c,
                  borderColor: color === c ? "white" : "transparent",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Horario de clases
            </label>
            <button
              type="button"
              onClick={addSlot}
              className="text-xs text-purple-400 hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Agregar día
            </button>
          </div>
          {slots.map((slot, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                name="day"
                value={slot.day}
                onChange={(e) => updateSlot(i, "day", e.target.value)}
                className="flex-1 bg-muted/50 text-sm rounded-lg px-3 py-2 outline-none border border-border"
              >
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <input
                type="time"
                name="time"
                value={slot.time}
                onChange={(e) => updateSlot(i, "time", e.target.value)}
                className="flex-1 bg-muted/50 text-sm rounded-lg px-3 py-2 outline-none border border-border"
              />
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/faculty/subjects"
            className="flex-1 py-3 text-center text-sm font-medium text-muted-foreground bg-card border border-border rounded-xl hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-3 text-sm font-semibold bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white rounded-xl transition-colors"
          >
            {pending ? "Guardando..." : "Guardar materia"}
          </button>
        </div>
      </form>
    </div>
  );
}
