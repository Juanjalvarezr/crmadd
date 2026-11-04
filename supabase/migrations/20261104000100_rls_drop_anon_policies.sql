-- RLS hardening (parte 2): eliminar escrituras/lecturas anónimas legacy.
-- Se conserva solo la lectura pública de proyectos para /public/proyecto/:id
-- y los policies de intake anónimo de prospecting_pipeline.
-- Todo lo demás queda cubierto por "Authenticated all" (auth.uid() IS NOT NULL).

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname NOT IN ('Authenticated all', 'Public read proyectos', 'public_read_proyectos')
      AND NOT (tablename = 'prospecting_pipeline' AND policyname LIKE 'permitir_%')
      AND (
        policyname LIKE 'public_write_%'
        OR policyname LIKE 'public_read_%'
        OR policyname LIKE 'anon_all_%'
        OR policyname = 'Allow all'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
