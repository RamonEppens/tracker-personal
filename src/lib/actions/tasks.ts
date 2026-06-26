"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────
// Crear tarea + sync Google Calendar
// ─────────────────────────────────────────────
export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title       = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const module      = formData.get("module") as "work" | "faculty";
  const priority    = (formData.get("priority") as string) || "medium";
  const due_date    = formData.get("due_date") as string | null;
  const subject_id  = formData.get("subject_id") as string | null;

  if (!title?.trim()) throw new Error("El título es obligatorio.");

  let google_event_id: string | null = null;

  // Intentar sync con Google Calendar si hay fecha límite
  if (due_date) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (token) {
        google_event_id = await createCalendarEvent(token, {
          title,
          description: description || undefined,
          date: due_date,
          module,
        });
      }
    } catch {
      // Sync falla silenciosamente — la tarea igual se guarda
    }
  }

  const { error } = await supabase.from("tasks").insert({
    user_id:         user.id,
    title:           title.trim(),
    description:     description?.trim() || null,
    module,
    priority,
    due_date:        due_date || null,
    subject_id:      subject_id || null,
    google_event_id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/${module}`);
  redirect(`/dashboard/${module}`);
}

// ─────────────────────────────────────────────
// Marcar tarea como hecha / pendiente
// ─────────────────────────────────────────────
export async function toggleTask(taskId: string, done: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("tasks")
    .update({ done })
    .eq("id", taskId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/work");
  revalidatePath("/dashboard/faculty");
  revalidatePath("/dashboard");
}

// ─────────────────────────────────────────────
// Eliminar tarea (+ evento de Calendar si existe)
// ─────────────────────────────────────────────
export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Obtener google_event_id antes de borrar
  const { data: task } = await supabase
    .from("tasks")
    .select("google_event_id, module")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (task?.google_event_id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (token) await deleteCalendarEvent(token, task.google_event_id);
    } catch { /* fallo silencioso */ }
  }

  await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);

  revalidatePath(`/dashboard/${task?.module ?? "work"}`);
  revalidatePath("/dashboard");
}

// ─────────────────────────────────────────────
// Google Calendar helpers
// ─────────────────────────────────────────────
async function createCalendarEvent(
  token: string,
  event: { title: string; description?: string; date: string; module: string }
): Promise<string | null> {
  const emoji = event.module === "work" ? "💼" : "🎓";
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `${emoji} ${event.title}`,
        description: event.description,
        start: { date: event.date },
        end:   { date: event.date },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 60 * 24 }],
        },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

async function deleteCalendarEvent(token: string, eventId: string) {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
}
