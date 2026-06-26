import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user.user_metadata?.full_name as string | undefined;
  const userEmail = user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — visible en desktop */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Contenido principal */}
      <div className="md:pl-56 flex flex-col min-h-screen">
        <TopBar userName={userName} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 animate-fade-in-up">
          {children}
        </main>
      </div>

      {/* Bottom nav — visible en mobile */}
      <BottomNav />
    </div>
  );
}
