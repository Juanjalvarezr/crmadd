-- RLS: habilitar en tablas sensibles
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden leer/escribir todo (MVP)
CREATE POLICY "Allow read access" ON public.clientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.clientes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.clientes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.clientes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access" ON public.proyectos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.proyectos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.proyectos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.proyectos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access" ON public.tareas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.tareas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.tareas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.tareas FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access" ON public.oportunidades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.oportunidades FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.oportunidades FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.oportunidades FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access" ON public.transacciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.transacciones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.transacciones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.transacciones FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access" ON public.contratos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.contratos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.contratos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.contratos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access" ON public.facturas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access" ON public.facturas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access" ON public.facturas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access" ON public.facturas FOR DELETE USING (auth.role() = 'authenticated');
