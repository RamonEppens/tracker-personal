"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "openid email profile https://www.googleapis.com/auth/calendar",
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError(`Error de Supabase: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data?.url) {
        console.log("Redirigiendo a:", data.url);
        window.location.href = data.url;
      } else {
        setError("No se pudo obtener la URL de autenticación.");
        setLoading(false);
      }
    } catch (e) {
      setError(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs space-y-10 animate-fade-in-up">

        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h1 className="font-playfair text-3xl font-semibold text-foreground tracking-tight">
            Tracker Personal
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Gimnasio · Trabajo · Facultad
          </p>
        </div>

        {/* Panel de acceso */}
        <div className="bg-card border border-border rounded p-8 space-y-6 shadow-sm">
          <div className="space-y-1 text-center">
            <h2 className="font-playfair text-lg text-foreground">Bienvenido</h2>
            <p className="text-sm text-muted-foreground">
              Accedé con tu cuenta de Google.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-stone-800 hover:bg-stone-50 disabled:opacity-50 border border-stone-200 font-medium py-2.5 px-4 rounded transition-all duration-150 text-sm shadow-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Conectando..." : "Continuar con Google"}
          </button>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-3 text-center">
              {error}
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Se solicitará acceso a Google Calendar para sincronizar eventos.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
