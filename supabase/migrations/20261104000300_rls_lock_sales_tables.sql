-- RLS hardening (parte 4): cerrar Allow all restantes en tablas de negocio
-- de ventas/cotización. Se excluye n8n_events (intake n8n) y sub_items (público App).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('metas_ventas','oportunidad_seguimientos','plantillas_cotizacion')
      AND policyname <> 'Authenticated all'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;

  FOR r IN
    SELECT unnest(ARRAY['metas_ventas','oportunidad_seguimientos','plantillas_cotizacion']) AS t
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated all" ON %I', r.t);
    EXECUTE format('CREATE POLICY "Authenticated all" ON %I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', r.t);
  END LOOP;
END $$;
