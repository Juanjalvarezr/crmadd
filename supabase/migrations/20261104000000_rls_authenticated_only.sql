-- RLS hardening: solo usuarios autenticados (auth.uid() IS NOT NULL)
-- Excepción: lectura pública de proyectos para /public/proyecto/:id (sin email cliente).
-- Reemplaza la política "Allow all" USING(true) por "Authenticated all".

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'clientes','equipo','servicios','configuracion_empresa',
      'oportunidades','proyectos','tareas','campanas_email',
      'plantillas_email','reglas_negocio_ai','conocimiento_agencia',
      'interacciones','prompts_ai','audit_logs',
      'facturas','pagos','plantillas_documentos','documentos',
      'contratos','briefs','sops','logs','crm_events'
    ])
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated all" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "Authenticated all" ON %I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t
    );
    EXECUTE format('DROP POLICY IF EXISTS "Public read proyectos" ON %I', t);
  END LOOP;

  -- Lectura pública (anon) solo para la página pública de seguimiento
  EXECUTE 'CREATE POLICY "Public read proyectos" ON proyectos FOR SELECT TO anon USING (true)';
END $$;
