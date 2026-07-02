-- 1. Deshabilitar acceso público total
DROP POLICY IF EXISTS "Allow all" ON clientes;

-- 2. Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para usuarios autenticados (asumiendo que Juan José se loguea)
-- Si aún no usas Auth, al menos restringe por una API Key de aplicación o IP.
CREATE POLICY "Authenticated users can manage clients" 
ON clientes 
FOR ALL 
TO authenticated 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Repetir para tareas, proyectos y oportunidades.