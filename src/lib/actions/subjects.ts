"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSubject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name      = formData.get("name") as string;
  const semester  = formData.get("semester") as string;
  const color     = formData.get("color") as string;

  // Horarios: días y horas vienen como campos separados
  const days  = formData.getAll("day") as string[];
  const times = formData.getAll("time") as string[];
  const schedule_slots = days
    .map((day, i) => ({ day, time: times[i] || "" }))
    .filter((s) => s.day && s.time);

  if (!name?.trim()) throw new Error("El nombre es obligatorio.");

  const { error } = await supabase.from("subjects").insert({
    user_id: user.id,
    name:    name.trim(),
    semester: semester?.trim() || "2025",
    color:   color || "#d946ef",
    schedule_slots,
    status:  "active",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/faculty");
  revalidatePath("/dashboard/faculty/subjects");
  redirect("/dashboard/faculty/subjects");
}

export async function updateSubjectStatus(
  subjectId: string,
  status: "active" | "passed" | "failed" | "pending"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("subjects")
    .update({ status })
    .eq("id", subjectId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/faculty");
  revalidatePath("/dashboard/faculty/subjects");
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/faculty");
  revalidatePath("/dashboard/faculty/subjects");
}
