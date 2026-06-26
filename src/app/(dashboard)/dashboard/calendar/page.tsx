import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgendaView } from "@/components/calendar/AgendaView";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <AgendaView />;
}
