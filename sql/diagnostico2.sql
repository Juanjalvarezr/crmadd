SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('clientes','proyectos','tareas','transacciones','facturas','contratos','oportunidades','servicios','equipo','n8n_events','conocimiento_agencia')
ORDER BY table_name, ordinal_position;

SELECT 'clientes' tabla, count(*) cnt FROM clientes UNION ALL
SELECT 'proyectos', count(*) FROM proyectos UNION ALL
SELECT 'tareas', count(*) FROM tareas UNION ALL
SELECT 'transacciones', count(*) FROM transacciones UNION ALL
SELECT 'facturas', count(*) FROM facturas UNION ALL
SELECT 'contratos', count(*) FROM contratos UNION ALL
SELECT 'oportunidades', count(*) FROM oportunidades UNION ALL
SELECT 'servicios', count(*) FROM servicios UNION ALL
SELECT 'equipo', count(*) FROM equipo;
