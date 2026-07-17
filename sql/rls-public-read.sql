-- Ajustar RLS sin consultar pg_policies: borrar políticas SELECT y recrear
-- Lectura pública para anon, escritura solo authenticated

-- Borrar políticas SELECT existentes por tabla
DROP POLICY IF EXISTS "Allow read access" ON public.transacciones;
DROP POLICY IF EXISTS "Allow read clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow read proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Allow read tareas" ON public.tareas;
DROP POLICY IF EXISTS "Allow read oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Allow read transacciones" ON public.transacciones;
DROP POLICY IF EXISTS "Allow read facturas" ON public.facturas;
DROP POLICY IF EXISTS "Allow read contratos" ON public.contratos;
DROP POLICY IF EXISTS "Allow read servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow read equipo" ON public.equipo;
DROP POLICY IF EXISTS "Allow read n8n_events" ON public.n8n_events;
DROP POLICY IF EXISTS "Allow read configuracion_empresa" ON public.configuracion_empresa;
DROP POLICY IF EXISTS "Allow read documentos" ON public.documentos;

-- Lectura pública abierta
CREATE POLICY "Allow read clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Allow read proyectos" ON public.proyectos FOR SELECT USING (true);
CREATE POLICY "Allow read tareas" ON public.tareas FOR SELECT USING (true);
CREATE POLICY "Allow read oportunidades" ON public.oportunidades FOR SELECT USING (true);
CREATE POLICY "Allow read transacciones" ON public.transacciones FOR SELECT USING (true);
CREATE POLICY "Allow read facturas" ON public.facturas FOR SELECT USING (true);
CREATE POLICY "Allow read contratos" ON public.contratos FOR SELECT USING (true);
CREATE POLICY "Allow read servicios" ON public.servicios FOR SELECT USING (true);
CREATE POLICY "Allow read equipo" ON public.equipo FOR SELECT USING (true);
CREATE POLICY "Allow read n8n_events" ON public.n8n_events FOR SELECT USING (true);
CREATE POLICY "Allow read configuracion_empresa" ON public.configuracion_empresa FOR SELECT USING (true);
CREATE POLICY "Allow read documentos" ON public.documentos FOR SELECT USING (true);

-- Escritura autenticada
DROP POLICY IF EXISTS "Allow write clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow write proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Allow write tareas" ON public.tareas;
DROP POLICY IF EXISTS "Allow write oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Allow write transacciones" ON public.transacciones;
DROP POLICY IF EXISTS "Allow write facturas" ON public.facturas;
DROP POLICY IF EXISTS "Allow write contratos" ON public.contratos;
DROP POLICY IF EXISTS "Allow write servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow write equipo" ON public.equipo;
DROP POLICY IF EXISTS "Allow write n8n_events" ON public.n8n_events;
DROP POLICY IF EXISTS "Allow write configuracion_empresa" ON public.configuracion_empresa;
DROP POLICY IF EXISTS "Allow write documentos" ON public.documentos;

CREATE POLICY "Allow write clientes" ON public.clientes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write proyectos" ON public.proyectos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write tareas" ON public.tareas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write oportunidades" ON public.oportunidades FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write transacciones" ON public.transacciones FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write facturas" ON public.facturas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write contratos" ON public.contratos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write servicios" ON public.servicios FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write equipo" ON public.equipo FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write n8n_events" ON public.n8n_events FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write configuracion_empresa" ON public.configuracion_empresa FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write documentos" ON public.documentos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.n8n_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documentos ENABLE ROW LEVEL SECURITY;
