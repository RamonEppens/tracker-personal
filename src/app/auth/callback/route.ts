import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Callback de OAuth — Supabase redirige aquí después del login con Google.
 * Intercambia el code por una sesión de usuario.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falla, volvemos al login con un error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
