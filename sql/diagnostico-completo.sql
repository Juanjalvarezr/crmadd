-- Diagnóstico tablas y columnas completas
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('clientes','proyectos','tareas','transacciones','facturas','contratos','oportunidades','servicios','equipo','n8n_events','conocimiento_agencia','credenciales_proyecto')
ORDER BY table_name, ordinal_position;

-- Políticas existentes
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Contadores
SELECT 'clientes' tabla, count(*) cnt FROM clientes UNION ALL
SELECT 'proyectos', count(*) FROM proyectos UNION ALL
SELECT 'tareas', count(*) FROM tareas UNION ALL
SELECT 'transacciones', count(*) FROM transacciones UNION ALL
SELECT 'facturas', count(*) FROM facturas UNION ALL
SELECT 'contratos', count(*) FROM contratos UNION ALL
SELECT 'oportunidades', count(*) FROM oportunidades UNION ALL
SELECT 'servicios', count(*) FROM servicios UNION ALL
SELECT 'equipo', count(*) FROM equipo;

-- Autenticación auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
