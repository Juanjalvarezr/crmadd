-- ============================================================
-- DIAGNÓSTICO SEGURO — no falla si faltan tablas
-- Ejecutar en el proyecto Supabase equivocado
-- ============================================================

-- 1) Objetos del repair que existen ahora
SELECT 'tabla' AS tipo, table_name AS nombre
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'clientes','equipo','subagentes','servicios','configuracion_empresa',
    'oportunidades','proyectos','tareas','interacciones','audit_logs',
    'reglas_negocio_ai','conocimiento_agencia','prompts_ai',
    'campanas_email','plantillas_email',
    'facturas','pagos','plantillas_documentos','documentos',
    'contratos','briefs','sops'
  )
UNION ALL
SELECT 'vista', table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'vista_proyectos_cliente','vista_tareas_completas','vista_kpi_dashboard'
  )
UNION ALL
SELECT 'indice', indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE ANY (
    ARRAY[
      'idx_clientes_estado%','idx_oportunidades_etapa%','idx_oportunidades_estado%',
      'idx_oportunidades_cliente_id%','idx_proyectos_estado%','idx_proyectos_cliente_id%',
      'idx_tareas_estado%','idx_tareas_proyecto_id%','idx_interacciones_cliente_id%',
      'idx_conocimiento_embedding%','idx_oportunidades_abiertas%','idx_proyectos_activos%',
      'idx_tareas_pendientes%','idx_clientes_activos%',
      'idx_facturas_cliente_id%','idx_facturas_proyecto_id%','idx_pagos_factura_id%',
      'idx_documentos_proyecto_id%','idx_documentos_cliente_id%',
      'idx_contratos_proyecto_id%','idx_briefs_proyecto_id%'
    ]
  )
UNION ALL
SELECT 'politica', policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','equipo','servicios','configuracion_empresa',
    'oportunidades','proyectos','tareas','interacciones','audit_logs',
    'reglas_negocio_ai','conocimiento_agencia','prompts_ai',
    'campanas_email','plantillas_email',
    'facturas','pagos','plantillas_documentos','documentos',
    'contratos','briefs','sops'
  )
UNION ALL
SELECT 'funcion', proname
FROM pg_proc
WHERE proname IN (
  'actualizar_ultima_interaccion',
  'log_proyecto_completado_func',
  'buscar_conocimiento'
)
UNION ALL
SELECT 'trigger', trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trg_actualizar_ultima_interaccion',
    'log_proyecto_completado'
  )
ORDER BY tipo, nombre;

-- 2) Conteo solo de tablas que SÍ existen
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'clientes','equipo','subagentes','servicios','configuracion_empresa',
        'oportunidades','proyectos','tareas','interacciones','audit_logs',
        'reglas_negocio_ai','conocimiento_agencia','prompts_ai',
        'campanas_email','plantillas_email',
        'facturas','pagos','plantillas_documentos','documentos',
        'contratos','briefs','sops'
      )
  LOOP
    EXECUTE format('SELECT COUNT(*) AS cnt FROM %I', r.table_name);
  END LOOP;
END $$;
