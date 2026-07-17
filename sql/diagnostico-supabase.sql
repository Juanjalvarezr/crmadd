-- Diagnóstico tablas existentes
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Diagnóstico columnas de tablas core
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('clientes','proyectos','tareas','transacciones','facturas','contratos','oportunidades','servicios','equipo','n8n_events')
ORDER BY table_name, ordinal_position;

-- Diagnóstico políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Diagnóstico usuarios auth (si existe extensión)
SELECT id, email, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Diagnóstico foreign keys
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('clientes','proyectos','tareas','transacciones','facturas','contratos','oportunidades','equipo')
ORDER BY tc.table_name, kcu.column_name;
