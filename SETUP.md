# Setup — Tracker Personal

Guía completa para tener la app corriendo en tu computadora y deployada en Vercel.

---

## Requisitos previos

- **Node.js 18+** — descargarlo de [nodejs.org](https://nodejs.org)
- Una cuenta en **[Supabase](https://supabase.com)** (gratis)
- Una cuenta en **[Vercel](https://vercel.com)** (gratis, podés entrar con GitHub)
- Una cuenta de **Google** (para el login y Google Calendar)

---

## Paso 1 — Instalar dependencias del proyecto

Abrí una terminal en la carpeta `tracker-app` y ejecutá:

```bash
npm install
```

---

## Paso 2 — Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) → **New project**
2. Elegí un nombre (ej: `tracker-personal`), una contraseña segura y región `South America (São Paulo)`
3. Esperá que el proyecto se cree (~1 minuto)
4. Andá a **SQL Editor** (menú izquierdo) → **New query**
5. Copiá y pegá el contenido completo de `supabase/schema.sql` y ejecutalo con **Run**

---

## Paso 3 — Configurar Google OAuth en Supabase

1. En tu proyecto de Supabase, andá a **Authentication → Providers → Google**
2. Activalo y copiá la **Callback URL** que te muestra (algo como `https://xxxx.supabase.co/auth/v1/callback`)

Ahora configurá el proyecto en Google Cloud:
1. Andá a [console.cloud.google.com](https://console.cloud.google.com)
2. Creá un nuevo proyecto (o usá uno existente)
3. **APIs & Services → Library** → buscá y habilitá:
   - `Google Calendar API`
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: pegá la Callback URL de Supabase
5. Copiá el **Client ID** y **Client Secret** generados
6. Volvé a Supabase → Google provider → pegá el Client ID y Client Secret → **Save**

---

## Paso 4 — Variables de entorno

1. Copiá `.env.local.example` como `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. En Supabase → **Settings → API**, copiá:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Editá `.env.local` con esos valores

---

## Paso 5 — Correr en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) — debería redirigirte a `/login`.

---

## Paso 6 — Deploy en Vercel

1. Subí el proyecto a un repositorio de GitHub
2. Entrá a [vercel.com](https://vercel.com) → **New Project** → importá tu repo
3. En **Environment Variables**, agregá las mismas variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-app.vercel.app`
4. Deploy → Vercel te da una URL pública

5. **Importante:** volvé a Google Cloud → tu OAuth client → agregá la URL de Vercel a **Authorized redirect URIs**

---

## Paso 7 — Instalar como app en el celular (PWA)

**iPhone (Safari):**
1. Abrí la URL de tu app en Safari
2. Compartir → "Agregar a pantalla de inicio"

**Android (Chrome):**
1. Abrí la URL en Chrome
2. Menú (3 puntos) → "Instalar app"

---

## Estructura del proyecto

```
tracker-app/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        ← Páginas protegidas (requieren login)
│   │   │   ├── page.tsx        ← Dashboard home
│   │   │   ├── gym/page.tsx    ← Módulo Gym
│   │   │   ├── work/page.tsx   ← Módulo Trabajo
│   │   │   ├── faculty/page.tsx← Módulo Facultad
│   │   │   └── calendar/page.tsx← Agenda
│   │   ├── login/page.tsx      ← Página de login
│   │   └── auth/callback/      ← Callback de OAuth
│   ├── components/
│   │   └── layout/             ← Sidebar, BottomNav, TopBar
│   ├── lib/
│   │   ├── supabase/           ← Cliente Supabase (browser + server)
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts         ← Tipos TypeScript del schema
│   └── middleware.ts            ← Protección de rutas
├── supabase/
│   └── schema.sql              ← Schema completo de la DB
├── public/
│   └── manifest.json           ← Config de PWA
└── SETUP.md                    ← Esta guía
```

---

## Próximos pasos (Fase 2 — Gym en detalle)

Una vez que el login funcione y puedas navegar entre módulos, el siguiente paso es construir:
- Formulario para crear nuevas sesiones de gym
- Log de sets (ejercicio + reps + peso) con autocompletado de ejercicios
- Gráficos de progresión con Recharts
- Vista de historial
