-- ─────────────────────────────────────────────────────────────
-- Sesión Día 1 — Espalda + Bíceps
-- Fecha: miércoles 24 de junio de 2026
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_user_id   UUID;
  v_session_id UUID;

  -- Exercise IDs
  id_dominada  UUID;
  id_remo_t    UUID;
  id_jalon_uni UUID;
  id_jalon_pro UUID;
  id_pullover  UUID;
  id_bicep     UUID;
BEGIN

  -- Usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'reppens@itba.edu.ar';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Ejercicios (globales, is_custom = false)
  SELECT id INTO id_dominada  FROM exercises WHERE name = 'Dominada con peso'                              LIMIT 1;
  SELECT id INTO id_remo_t    FROM exercises WHERE name = 'Remo T'                                         LIMIT 1;
  SELECT id INTO id_jalon_uni FROM exercises WHERE name = 'Jalón unilateral en polea'                      LIMIT 1;
  SELECT id INTO id_jalon_pro FROM exercises WHERE name = 'Jalón prono con barra'                          LIMIT 1;
  SELECT id INTO id_pullover  FROM exercises WHERE name = 'Pull over en polea'                             LIMIT 1;
  SELECT id INTO id_bicep     FROM exercises WHERE name = 'Bícep finisher (spider + supino + martillo)'    LIMIT 1;

  -- ── Crear sesión ──
  INSERT INTO workout_sessions (user_id, date, duration_minutes, notes)
  VALUES (v_user_id, '2026-06-24', 70, 'Día 1 — Espalda + Bíceps')
  RETURNING id INTO v_session_id;

  -- ── Dominada con peso — 2×(5-8) con 10 kg + 1 sin peso al fallo ──
  INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
    (v_session_id, id_dominada, 1, 6,  10,  NULL),
    (v_session_id, id_dominada, 2, 6,  10,  NULL),
    (v_session_id, id_dominada, 3, 10, 0,   'Sin peso, al fallo');

  -- ── Remo T — 3×8-10 @ 25 kg ──
  INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg) VALUES
    (v_session_id, id_remo_t, 1, 9, 25),
    (v_session_id, id_remo_t, 2, 9, 25),
    (v_session_id, id_remo_t, 3, 8, 25);

  -- ── Jalón unilateral en polea — 3×8-10 @ 14.7 kg ──
  INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg) VALUES
    (v_session_id, id_jalon_uni, 1, 9, 14.7),
    (v_session_id, id_jalon_uni, 2, 9, 14.7),
    (v_session_id, id_jalon_uni, 3, 8, 14.7);

  -- ── Jalón prono con barra — 3×8-10 @ 38.5 kg ──
  INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg) VALUES
    (v_session_id, id_jalon_pro, 1, 9, 38.5),
    (v_session_id, id_jalon_pro, 2, 9, 38.5),
    (v_session_id, id_jalon_pro, 3, 8, 38.5);

  -- ── Pull over en polea — 3×8-10 @ 21.5 kg ──
  INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg) VALUES
    (v_session_id, id_pullover, 1, 9, 21.5),
    (v_session_id, id_pullover, 2, 9, 21.5),
    (v_session_id, id_pullover, 3, 8, 21.5);

  -- ── Bícep finisher — 3×7 @ 15 lbs (6.8 kg) ──
  INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg, notes) VALUES
    (v_session_id, id_bicep, 1, 7, 6.8, 'Spider + supino + martillo'),
    (v_session_id, id_bicep, 2, 7, 6.8, NULL),
    (v_session_id, id_bicep, 3, 7, 6.8, NULL);

  RAISE NOTICE 'Sesión insertada — ID: %', v_session_id;
END $$;
