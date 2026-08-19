-- ============================================================
-- CLEANUP PROYECTO EQUIVOCADO — solo objetos del repair
-- No borra datos, no elimina tablas originales.
-- Ejecutar en el proyecto donde pegaste el script por error.
-- ============================================================

-- 1) Vistas del repair (si existen)
DROP VIEW IF EXISTS vista_kpi_dashboard;
DROP VIEW IF EXISTS vista_tareas_completas;
DROP VIEW IF EXISTS vista_proyectos_cliente;

-- 2) Funciones del repair
DROP FUNCTION IF EXISTS actualizar_ultima_interaccion();
DROP FUNCTION IF EXISTS log_proyecto_completado_func();
DROP FUNCTION IF EXISTS buscar_conocimiento(vector(768), float, int);

-- 3) Índices específicos del repair
DROP INDEX IF EXISTS idx_clientes_estado;
DROP INDEX IF EXISTS idx_oportunidades_etapa;
DROP INDEX IF EXISTS idx_oportunidades_estado;
DROP INDEX IF EXISTS idx_oportunidades_cliente_id;
DROP INDEX IF EXISTS idx_proyectos_estado;
DROP INDEX IF EXISTS idx_proyectos_cliente_id;
DROP INDEX IF EXISTS idx_tareas_estado;
DROP INDEX IF EXISTS idx_tareas_proyecto_id;
DROP INDEX IF EXISTS idx_interacciones_cliente_id;
DROP INDEX IF EXISTS idx_oportunidades_abiertas;
DROP INDEX IF EXISTS idx_proyectos_activos;
DROP INDEX IF EXISTS idx_tareas_pendientes;
DROP INDEX IF EXISTS idx_clientes_activos;
DROP INDEX IF EXISTS idx_conocimiento_embedding;
DROP INDEX IF EXISTS idx_facturas_cliente_id;
DROP INDEX IF EXISTS idx_facturas_proyecto_id;
DROP INDEX IF EXISTS idx_pagos_factura_id;
DROP INDEX IF EXISTS idx_documentos_proyecto_id;
DROP INDEX IF EXISTS idx_documentos_cliente_id;
DROP INDEX IF EXISTS idx_contratos_proyecto_id;
DROP INDEX IF EXISTS idx_briefs_proyecto_id;

-- 4) Políticas específicas del repair
-- Estas son políticas genéricas/duplicadas del repair
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname = 'Allow all'
        OR policyname LIKE 'Allow delete%'
        OR policyname LIKE 'Allow insert%'
        OR policyname LIKE 'Allow read%'
        OR policyname LIKE 'Allow update%'
        OR policyname LIKE 'Allow write%'
        OR policyname LIKE 'Public %'
        OR policyname LIKE 'Authenticated %'
        OR policyname IN (
          'clientes_delete_policy','clientes_insert_policy',
          'clientes_read_authenticated','clientes_read_policy',
          'clientes_update_policy',
          'contratos_public_read','contratos_public_write',
          'contratos_read_authenticated',
          'docs_delete','docs_insert','docs_read','docs_update',
          'documentos_read_authenticated',
          'facturas_public_read','facturas_public_write',
          'facturas_read_authenticated',
          'proyectos_read_authenticated',
          'tareas_read_authenticated'
        )
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 5) Si ejecutaste el repair completo, deshacer rename subagentes -> equipo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipo')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subagentes') THEN
    -- Si ambas existen, no hacemos nada; el repair detecta este caso y no renombra
    NULL;
  END IF;
END $$;

-- 6) Si existe la tabla contratos/documentos/facturas creada por el repair
-- y este proyecto NO es el CRM, las dejamos; si querés borrarlas descomentar:
-- DROP TABLE IF EXISTS facturas CASCADE;
-- DROP TABLE IF EXISTS pagos CASCADE;
-- DROP TABLE IF EXISTS plantillas_documentos CASCADE;
-- DROP TABLE IF EXISTS documentos CASCADE;
-- DROP TABLE IF EXISTS contratos CASCADE;
-- DROP TABLE IF EXISTS briefs CASCADE;
-- DROP TABLE IF EXISTS sops CASCADE;
