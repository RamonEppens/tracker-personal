-- =========================================================
-- TRACKER PERSONAL — Schema de base de datos (Supabase/PostgreSQL)
-- Ejecutar este archivo en: Supabase Dashboard → SQL Editor
-- =========================================================

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";


-- ─────────────────────────────────────────────────────────
-- EJERCICIOS (catálogo base + ejercicios custom del usuario)
-- ─────────────────────────────────────────────────────────
create table public.exercises (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  muscle_group  text not null,  -- 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  description   text,
  is_custom     boolean not null default false,
  user_id       uuid references auth.users(id) on delete cascade,  -- null = ejercicio del catálogo global
  created_at    timestamptz not null default now()
);

-- Index para buscar ejercicios por usuario
create index idx_exercises_user on public.exercises(user_id);

-- RLS: los usuarios ven el catálogo global (user_id is null) + sus propios ejercicios
alter table public.exercises enable row level security;

create policy "Ver catálogo y ejercicios propios"
  on public.exercises for select
  using (user_id is null or user_id = auth.uid());

create policy "Crear ejercicios propios"
  on public.exercises for insert
  with check (is_custom = true and user_id = auth.uid());

create policy "Editar ejercicios propios"
  on public.exercises for update
  using (user_id = auth.uid());

create policy "Borrar ejercicios propios"
  on public.exercises for delete
  using (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────
-- SESIONES DE ENTRENAMIENTO
-- ─────────────────────────────────────────────────────────
create table public.workout_sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  date              date not null,
  duration_minutes  int,
  notes             text,
  created_at        timestamptz not null default now()
);

create index idx_workout_sessions_user_date on public.workout_sessions(user_id, date desc);

alter table public.workout_sessions enable row level security;

create policy "CRUD sesiones propias"
  on public.workout_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────
-- SETS DE CADA SESIÓN (ejercicio + series + reps + peso)
-- ─────────────────────────────────────────────────────────
create table public.workout_sets (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_number  int not null,
  reps        int not null,
  weight_kg   numeric(6,2) not null default 0,
  notes       text
);

create index idx_workout_sets_session on public.workout_sets(session_id);

alter table public.workout_sets enable row level security;

-- Acceso via la sesión (que ya está protegida por RLS)
create policy "CRUD sets propios"
  on public.workout_sets for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────
-- PERSONAL RECORDS (actualizar automáticamente con una función)
-- ─────────────────────────────────────────────────────────
create table public.personal_records (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id),
  weight_kg    numeric(6,2) not null,
  reps         int not null,
  achieved_at  timestamptz not null default now(),
  unique (user_id, exercise_id)  -- un PR por ejercicio por usuario
);

alter table public.personal_records enable row level security;

create policy "CRUD PRs propios"
  on public.personal_records for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Función para actualizar PR automáticamente al insertar un set
create or replace function public.update_personal_record()
returns trigger language plpgsql security definer as $$
declare
  v_user_id uuid;
  v_current_pr numeric;
begin
  -- Obtener user_id de la sesión
  select user_id into v_user_id
  from public.workout_sessions
  where id = new.session_id;

  -- Verificar si el nuevo set supera el PR actual
  select weight_kg into v_current_pr
  from public.personal_records
  where user_id = v_user_id and exercise_id = new.exercise_id;

  if v_current_pr is null or new.weight_kg > v_current_pr then
    insert into public.personal_records (user_id, exercise_id, weight_kg, reps, achieved_at)
    values (v_user_id, new.exercise_id, new.weight_kg, new.reps, now())
    on conflict (user_id, exercise_id)
    do update set weight_kg = excluded.weight_kg, reps = excluded.reps, achieved_at = excluded.achieved_at;
  end if;

  return new;
end;
$$;

create trigger trg_update_pr
  after insert on public.workout_sets
  for each row execute function public.update_personal_record();


-- ─────────────────────────────────────────────────────────
-- MATERIAS (Facultad)
-- ─────────────────────────────────────────────────────────
create table public.subjects (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  semester        text not null,  -- ej: '1C 2025', '2C 2025'
  schedule_slots  jsonb not null default '[]',  -- [{"day": "Lunes", "time": "18:00", "room": "Aula 12"}]
  status          text not null default 'active'
                  check (status in ('active', 'passed', 'failed', 'pending')),
  color           text,  -- color hex para mostrar en UI (#d946ef)
  created_at      timestamptz not null default now()
);

create index idx_subjects_user on public.subjects(user_id);

alter table public.subjects enable row level security;

create policy "CRUD materias propias"
  on public.subjects for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────
-- TAREAS (Trabajo + Facultad)
-- ─────────────────────────────────────────────────────────
create table public.tasks (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  description      text,
  module           text not null check (module in ('work', 'faculty')),
  priority         text not null default 'medium'
                   check (priority in ('low', 'medium', 'high')),
  done             boolean not null default false,
  due_date         date,
  subject_id       uuid references public.subjects(id) on delete set null,
  google_event_id  text,  -- ID del evento en Google Calendar (para sync)
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index idx_tasks_user_module on public.tasks(user_id, module);
create index idx_tasks_due_date on public.tasks(user_id, due_date);

alter table public.tasks enable row level security;

create policy "CRUD tareas propias"
  on public.tasks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-set completed_at cuando se marca done
create or replace function public.set_task_completed_at()
returns trigger language plpgsql as $$
begin
  if new.done = true and old.done = false then
    new.completed_at = now();
  elsif new.done = false then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_task_completed_at
  before update on public.tasks
  for each row execute function public.set_task_completed_at();


-- ─────────────────────────────────────────────────────────
-- LOGROS / ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────
create table public.achievements (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  module      text not null check (module in ('work', 'faculty', 'gym')),
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index idx_achievements_user on public.achievements(user_id, module);

alter table public.achievements enable row level security;

create policy "CRUD logros propios"
  on public.achievements for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────
-- RUTINAS — estructura del programa semanal
-- ─────────────────────────────────────────────────────────
create table public.routines (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.routines enable row level security;
create policy "CRUD rutinas propias" on public.routines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());


-- Días dentro de una rutina (Día 1 - Espalda, Día 2 - Piernas, etc.)
create table public.routine_days (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  name        text not null,         -- 'Día 1 - Espalda + Bíceps'
  day_order   int not null,          -- 1, 2, 3... para el orden
  notes       text                   -- notas generales del día
);

alter table public.routine_days enable row level security;
create policy "CRUD días de rutina propios" on public.routine_days for all
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));


-- Ejercicios dentro de cada día, con el esquema de series/reps
create table public.routine_day_exercises (
  id              uuid primary key default uuid_generate_v4(),
  routine_day_id  uuid not null references public.routine_days(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id),
  exercise_order  int not null,
  target_sets     int,               -- número de series (ej: 3)
  reps_scheme     text,              -- esquema de reps (ej: '8-10', 'Fallo', '2×5-8 + 1 sin peso al fallo')
  reference_weight text,             -- peso de referencia inicial (ej: '25kg', '15lbs')
  notes           text               -- notas específicas del ejercicio
);

alter table public.routine_day_exercises enable row level security;
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


-- ─────────────────────────────────────────────────────────
-- EJERCICIOS — catálogo basado en tu rutina actual
-- ─────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────
-- SEED — Rutina de Ramón (Semana 1)
-- Nota: el user_id se completa después del primer login.
-- Este bloque es para referencia; correrlo manualmente
-- reemplazando 'TU_USER_ID' con tu UUID de Supabase Auth.
-- ─────────────────────────────────────────────────────────

-- Para obtener tu user_id después de loguearte:
-- select id from auth.users where email = 'reppens@itba.edu.ar';

/*
do $$
declare
  v_user_id     uuid := 'TU_USER_ID';  -- <-- reemplazar
  v_routine_id  uuid;
  v_day_core    uuid;
  v_day1        uuid;
  v_day2        uuid;
  v_day3        uuid;
  ex            record;
begin

  -- Crear rutina
  insert into public.routines (user_id, name)
  values (v_user_id, 'Rutina Semana 1')
  returning id into v_routine_id;

  -- CORE
  insert into public.routine_days (routine_id, name, day_order, notes)
  values (v_routine_id, 'Core', 0, 'Se puede hacer cualquier día o al final de otro día.')
  returning id into v_day_core;

  -- Día 1
  insert into public.routine_days (routine_id, name, day_order, notes)
  values (v_routine_id, 'Día 1 — Espalda + Bíceps', 1, null)
  returning id into v_day1;

  -- Día 2
  insert into public.routine_days (routine_id, name, day_order, notes)
  values (v_routine_id, 'Día 2 — Piernas', 2, 'Calentar bien en sentadilla y peso muerto. En búlgaras, pierna de apoyo parada, agarrarse a algo.')
  returning id into v_day2;

  -- Día 3
  insert into public.routine_days (routine_id, name, day_order, notes)
  values (v_routine_id, 'Día 3 — Pecho + Tríceps + Hombro', 3, 'En press francés: solo se flexiona el codo, peso bajo.')
  returning id into v_day3;

  -- ── CORE exercises ──
  with ex_ids as (
    select id, name from public.exercises where is_custom = false
  )
  insert into public.routine_day_exercises (routine_day_id, exercise_id, exercise_order, target_sets, reps_scheme, reference_weight)
  select v_day_core, id, ord, sets, reps, weight from (values
    ('Elevaciones',                          1, null, 'Fallo',  null),
    ('Elevaciones estáticas',                2, 1,    'Fallo',  null),
    ('Crunch en banco declinado con peso',   3, 4,    '10-12',  null)
  ) t(ename, ord, sets, reps, weight)
  join ex_ids on ex_ids.name = t.ename;

  -- ── DÍA 1 exercises ──
  with ex_ids as (select id, name from public.exercises where is_custom = false)
  insert into public.routine_day_exercises (routine_day_id, exercise_id, exercise_order, target_sets, reps_scheme, reference_weight, notes)
  select v_day1, id, ord, sets, reps, weight, notes from (values
    ('Dominada con peso',                         1, 3,    '2×5-8 + 1 sin peso al fallo', '10kg',           null),
    ('Remo T',                                    2, 3,    '8-10',                         '25kg',           null),
    ('Jalón unilateral en polea',                 3, 3,    '8-10',                         '14.7kg',         null),
    ('Jalón prono con barra',                     4, 3,    '8-10',                         '38.5kg',         null),
    ('Pull over en polea',                        5, 3,    '8-10',                         '21.5kg',         null),
    ('Bícep finisher (spider + supino + martillo)', 6, null, 'Series al fallo (target: 9)', '15lbs (3 series)', 'Hacerlo con las mismas mancuernas para los tres, priorizar cantidad de series')
  ) t(ename, ord, sets, reps, weight, notes)
  join ex_ids on ex_ids.name = t.ename;

  -- ── DÍA 2 exercises ──
  with ex_ids as (select id, name from public.exercises where is_custom = false)
  insert into public.routine_day_exercises (routine_day_id, exercise_id, exercise_order, target_sets, reps_scheme, reference_weight, notes)
  select v_day2, id, ord, sets, reps, weight, notes from (values
    ('Sentadilla',               1, 5,    '1 aprox + 2×5-8 + 2×5-10', null, 'Aproximación: no siempre ir a lo más pesado'),
    ('Peso muerto',              2, 3,    '2×5-8 + 1×5-10',            null, 'Calentar bien'),
    ('Búlgaras / estocadas',     3, 3,    '8-10',                      null, 'Pierna de apoyo parada, agarrarse a algo'),
    ('Sillón isquios',           4, 3,    '8-10',                      null, null),
    ('Sillón cuádriceps',        5, 4,    '8-10',                      null, null),
    ('Gemelos',                  6, 4,    'Fallo',                     null, null),
    ('Vuelos laterales en banco 90° + mitad de peso', 7, 4, '12-15',  null, null)
  ) t(ename, ord, sets, reps, weight, notes)
  join ex_ids on ex_ids.name = t.ename;

  -- ── DÍA 3 exercises ──
  with ex_ids as (select id, name from public.exercises where is_custom = false)
  insert into public.routine_day_exercises (routine_day_id, exercise_id, exercise_order, target_sets, reps_scheme, reference_weight, notes)
  select v_day3, id, ord, sets, reps, weight, notes from (values
    ('Press inclinado con mancuernas +45°',            1, 3, '5-8',   null, null),
    ('Pec deck / apertura con mancuernas',             2, 4, '8-12',  null, null),
    ('Press inclinado con mancuernas (menor inclinación)', 3, 3, '8-10', null, null),
    ('Fondos (piernas para adelante)',                 4, 3, 'Fallo', null, null),
    ('Press francés en banco plano con mancuernas',   5, 4, '10-12', null, 'Solo se flexiona el codo, peso bajo'),
    ('Vuelos laterales en banco 90° + mitad de peso', 6, 4, '12-15', null, null)
  ) t(ename, ord, sets, reps, weight, notes)
  join ex_ids on ex_ids.name = t.ename;

end $$;
*/
