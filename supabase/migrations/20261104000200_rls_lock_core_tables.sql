-- RLS hardening (parte 3 / cierre): en tablas núcleo del CRM solo queda
-- "Authenticated all" (+ lectura pública de proyectos para /public/proyecto/:id).
-- Se eliminan legacy: anon_insert/select/update_%, Allow all%, conf_%, y
-- cualquier otra policy {anon}/{public} en estas tablas.
-- Se excluyen prospecting_pipeline (intake anónimo), webhooks/workflow/notificaciones
-- (automatización n8n) y sub_items (lectura pública ya existente, aparte).

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'clientes','equipo','servicios','configuracion_empresa','configuracion',
        'oportunidades','proyectos','tareas','campanas_email',
        'plantillas_email','reglas_negocio_ai','conocimiento_agencia',
        'interacciones','prompts_ai','audit_logs',
        'facturas','pagos','plantillas_documentos','documentos',
        'contratos','contrato_clausulas','contrato_versiones','briefs','sops',
        'logs','crm_events','cotizaciones','cuotas','transacciones','subagentes'
      )
      AND policyname NOT IN ('Authenticated all', 'Public read proyectos', 'public_read_proyectos')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
