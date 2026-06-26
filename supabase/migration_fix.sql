-- =========================================================
-- MIGRATION — corrige el schema inicial
-- Ejecutar en Supabase SQL Editor si ya corriste schema.sql antes
-- =========================================================

-- 1. Limpiar ejercicios genéricos del catálogo anterior
truncate public.exercises cascade;

-- 2. Insertar los ejercicios reales de la rutina
insert into public.exercises (name, muscle_group, description, is_custom) values
  -- CORE
  ('Elevaciones', 'core', 'Elevaciones de piernas colgado. Al fallo.', false),
  ('Elevaciones estáticas', 'core', 'Elevaciones estáticas de piernas. 1 serie al fallo.', false),
  ('Crunch en banco declinado con peso', 'core', 'Crunch en banco declinado sosteniendo peso. 4×10-12.', false),
  -- ESPALDA
  ('Dominada con peso', 'back', 'Dominada con lastre. 2×5-8 + 1 serie sin peso al fallo.', false),
  ('Remo T', 'back', 'Remo en T-bar. Espalda media y gruesa. 3×8-10.', false),
  ('Jalón unilateral en polea', 'back', 'Jalón en polea alta con un brazo. 3×8-10.', false),
  ('Jalón prono con barra', 'back', 'Jalón al pecho con agarre prono (palmas hacia adelante). 3×8-10.', false),
  ('Pull over en polea', 'back', 'Pull over en polea alta. Énfasis en dorsal inferior y serrato. 3×8-10.', false),
  -- BÍCEPS
  ('Bícep finisher (spider + supino + martillo)', 'arms', 'Triset al fallo: curl spider + curl supino + curl martillo con las mismas mancuernas. Priorizar cantidad de series.', false),
  -- PIERNAS
  ('Sentadilla', 'legs', '1 serie de aproximación + 4 efectivas. Esquema 2×5-8 + 2×5-10. Calentar bien antes.', false),
  ('Peso muerto', 'legs', '3 series efectivas. Esquema 2×5-8 + 1×5-10. Calentar bien antes.', false),
  ('Búlgaras / estocadas', 'legs', 'Sentadilla búlgara. Pierna de apoyo parada, agarrarse a algo para equilibrio. 3×8-10.', false),
  ('Sillón isquios', 'legs', 'Curl femoral en máquina (leg curl). 3×8-10.', false),
  ('Sillón cuádriceps', 'legs', 'Extensión de cuádriceps en máquina (leg extension). 4×8-10.', false),
  ('Gemelos', 'legs', 'Elevación de talones. 4 series al fallo.', false),
  -- PECHO
  ('Press inclinado con mancuernas +45°', 'chest', 'Press inclinado a 45 grados con mancuernas. Énfasis en pecho superior. 3×5-8.', false),
  ('Pec deck / apertura con mancuernas', 'chest', 'Pec deck en máquina o apertura con mancuernas. 4×8-12.', false),
  ('Press inclinado con mancuernas (menor inclinación)', 'chest', 'Press inclinado a menor ángulo que el primero. 3×8-10.', false),
  -- TRÍCEPS
  ('Fondos (piernas para adelante)', 'arms', 'Fondos en banco con piernas extendidas hacia adelante. 3 series al fallo.', false),
  ('Press francés en banco plano con mancuernas', 'arms', 'Press francés con mancuernas. Solo se flexiona el codo, peso bajo. 4×10-12.', false),
  -- HOMBROS
  ('Vuelos laterales en banco 90° + mitad de peso', 'shoulders', 'Elevaciones laterales en banco inclinado a 90 grados, con la mitad del peso habitual. 4×12-15.', false);

-- 3. Crear tablas nuevas para la estructura de la rutina
create table if not exists public.routines (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.routines enable row level security;

drop policy if exists "CRUD rutinas propias" on public.routines;
create policy "CRUD rutinas propias" on public.routines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.routine_days (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  name        text not null,
  day_order   int not null,
  notes       text
);

alter table public.routine_days enable row level security;

drop policy if exists "CRUD días de rutina propios" on public.routine_days;
create policy "CRUD días de rutina propios" on public.routine_days for all
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

create table if not exists public.routine_day_exercises (
  id              uuid primary key default uuid_generate_v4(),
  routine_day_id  uuid not null references public.routine_days(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id),
  exercise_order  int not null,
  target_sets     int,
  reps_scheme     text,
  reference_weight text,
  notes           text
);

alter table public.routine_day_exercises enable row level security;

drop policy if exists "CRUD ejercicios de rutina propios" on public.routine_day_exercises;
create policy "CRUD ejercicios de rutina propios" on public.routine_day_exercises for all
  using (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_day_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_day_id and r.user_id = auth.uid()
  ));
