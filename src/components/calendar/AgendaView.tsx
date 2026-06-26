"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Briefcase,
  GraduationCap,
  CalendarDays,
  ExternalLink,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  due_date: string;
  module: "work" | "faculty";
  done: boolean;
  subjects?: { name: string } | null;
};

type Session = {
  id: string;
  date: string;
  notes: string | null;
};

type GCalEvent = {
  id: string;
  summary?: string;
  start: { date?: string; dateTime?: string };
};

type DayMarkers = {
  gym: boolean;
  work: boolean;
  faculty: boolean;
  cal: boolean;
};

// JS getDay() is Sun=0; convert to Mon=0…Sun=6
function weekdayIdx(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

function toDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function calEventDate(e: GCalEvent): string | null {
  return e.start.date ?? e.start.dateTime?.split("T")[0] ?? null;
}

export function AgendaView() {
  const today = useMemo(() => new Date(), []);

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [calEvents, setCalEvents] = useState<GCalEvent[]>([]);
  const [calStatus, setCalStatus] = useState<"idle" | "ok" | "error" | "notoken">("idle");
  const [loading, setLoading] = useState(true);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setCalEvents([]);
      setCalStatus("idle");

      const supabase = createClient();
      const from = toDateStr(monthStart);
      const to = toDateStr(monthEnd);

      const [{ data: t }, { data: s }] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, due_date, module, done, subjects(name)")
          .eq("done", false)
          .gte("due_date", from)
          .lte("due_date", to),
        supabase
          .from("workout_sessions")
          .select("id, date, notes")
          .gte("date", from)
          .lte("date", to),
      ]);

      if (cancelled) return;
      setTasks((t as Task[]) ?? []);
      setSessions((s as Session[]) ?? []);
      setLoading(false);

      // Try Google Calendar
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.provider_token;
        if (!token) {
          if (!cancelled) setCalStatus("notoken");
          return;
        }

        const params = new URLSearchParams({
          timeMin: monthStart.toISOString(),
          timeMax: new Date(monthEnd.getTime() + 86400000).toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "100",
        });

        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (cancelled) return;

        if (res.ok) {
          const json = await res.json();
          setCalEvents(json.items ?? []);
          setCalStatus("ok");
        } else {
          setCalStatus("error");
        }
      } catch {
        if (!cancelled) setCalStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentMonth]);

  // Calendar grid: array of Date | null (null = padding)
  const calGrid = useMemo(() => {
    const days: (Date | null)[] = [];
    const pad = weekdayIdx(monthStart);
    for (let i = 0; i < pad; i++) days.push(null);
    const count = getDaysInMonth(currentMonth);
    for (let i = 1; i <= count; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  // Map: dateStr → DayMarkers
  const markerMap = useMemo(() => {
    const map: Record<string, DayMarkers> = {};
    const get = (k: string) => {
      if (!map[k]) map[k] = { gym: false, work: false, faculty: false, cal: false };
      return map[k];
    };
    for (const t of tasks) {
      if (!t.due_date) continue;
      const m = get(t.due_date);
      if (t.module === "work") m.work = true;
      else m.faculty = true;
    }
    for (const s of sessions) {
      get(s.date).gym = true;
    }
    for (const e of calEvents) {
      const d = calEventDate(e);
      if (d) get(d).cal = true;
    }
    return map;
  }, [tasks, sessions, calEvents]);

  // Events for the selected date
  const selectedStr = toDateStr(selectedDate);
  const dayTasks = tasks.filter((t) => t.due_date === selectedStr);
  const daySessions = sessions.filter((s) => s.date === selectedStr);
  // Only show cal events NOT created by this app (app events show as tasks already)
  // Simple heuristic: app events start with 🎓 or 💼
  const dayCalEvents = calEvents.filter((e) => {
    const d = calEventDate(e);
    if (d !== selectedStr) return false;
    const summary = e.summary ?? "";
    return !summary.startsWith("🎓") && !summary.startsWith("💼");
  });

  const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

  const hasAnythingSelected =
    dayTasks.length > 0 || daySessions.length > 0 || dayCalEvents.length > 0;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-xl font-semibold">Agenda</h1>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Google Calendar
          <ExternalLink size={10} />
        </a>
      </div>

      {/* Calendar card */}
      <div className="bg-card border border-border rounded">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <h2 className="font-playfair text-sm font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {weekdays.map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-medium text-muted-foreground py-1 tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 px-2 pb-3">
          {calGrid.map((day, i) => {
            if (!day) return <div key={i} className="py-1" />;
            const ds = toDateStr(day);
            const markers = markerMap[ds];
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-1 rounded transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-accent/60"
                }`}
              >
                <span
                  className={`text-xs w-6 h-6 flex items-center justify-center rounded-full leading-none ${
                    isTodayDate
                      ? "bg-primary text-primary-foreground font-semibold"
                      : isSelected
                      ? "text-primary font-medium"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
                {/* Event dots */}
                <div className="flex gap-0.5 h-1.5 mt-0.5 items-center">
                  {markers?.gym && (
                    <span className="w-1 h-1 rounded-full bg-gym block" />
                  )}
                  {markers?.work && (
                    <span className="w-1 h-1 rounded-full bg-work block" />
                  )}
                  {markers?.faculty && (
                    <span className="w-1 h-1 rounded-full bg-faculty block" />
                  )}
                  {markers?.cal && (
                    <span className="w-1 h-1 rounded-full bg-muted-foreground block" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gym inline-block" />
          Gimnasio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-work inline-block" />
          Trabajo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-faculty inline-block" />
          Facultad
        </span>
        {calStatus === "ok" && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            Google Calendar
          </span>
        )}
      </div>

      {/* Day detail */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 capitalize">
          {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>

        {loading ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Cargando…
          </div>
        ) : !hasAnythingSelected ? (
          <div className="py-10 text-center border border-dashed border-border rounded text-muted-foreground">
            <CalendarDays size={22} className="mx-auto mb-2 opacity-30" strokeWidth={1.5} />
            <p className="text-sm">Sin eventos este día</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Gym sessions */}
            {daySessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/gym/session/${s.id}`}
                className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border border-l-4 border-l-gym rounded hover:bg-accent/50 transition-colors"
              >
                <Dumbbell
                  size={13}
                  strokeWidth={1.5}
                  className="text-gym flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {s.notes ?? "Sesión de gimnasio"}
                  </p>
                  <p className="text-xs text-gym">Gimnasio</p>
                </div>
                <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
              </Link>
            ))}

            {/* Work & Faculty tasks */}
            {dayTasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded border-l-4 ${
                  t.module === "work" ? "border-l-work" : "border-l-faculty"
                }`}
              >
                {t.module === "work" ? (
                  <Briefcase
                    size={13}
                    strokeWidth={1.5}
                    className="text-work flex-shrink-0"
                  />
                ) : (
                  <GraduationCap
                    size={13}
                    strokeWidth={1.5}
                    className="text-faculty flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p
                    className={`text-xs ${
                      t.module === "work" ? "text-work" : "text-faculty"
                    }`}
                  >
                    {t.module === "work" ? "Trabajo" : "Facultad"}
                    {(t.subjects as any)?.name &&
                      ` · ${(t.subjects as any).name}`}
                  </p>
                </div>
              </div>
            ))}

            {/* External Google Calendar events */}
            {dayCalEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded border-l-4 border-l-muted-foreground"
              >
                <CalendarDays
                  size={13}
                  strokeWidth={1.5}
                  className="text-muted-foreground flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium">{e.summary ?? "Evento"}</p>
                  <p className="text-xs text-muted-foreground">Google Calendar</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Calendar status note */}
      {calStatus === "error" && (
        <p className="text-xs text-muted-foreground text-center">
          No se pudo cargar Google Calendar.{" "}
          <a
            href="/login"
            className="underline hover:text-foreground transition-colors"
          >
            Reconectá tu cuenta
          </a>{" "}
          para ver eventos externos.
        </p>
      )}
    </div>
  );
}
