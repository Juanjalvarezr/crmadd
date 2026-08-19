-- DESEO DIGITAL - Diagnóstico de schema real
-- Ejecutar en el SQL Editor de Supabase primero.
-- Devuelve tablas, columnas y constraints existentes.

SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_schema = 'public' AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- Constraints relevantes
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_type;

-- Si querés ver el estado de RLS:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
