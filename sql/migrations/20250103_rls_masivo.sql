-- RLS masivo para tablas restantes
-- Ejecutar cada bloque por separado en Supabase SQL Editor

-- 1) RLS en tablas operativas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantillas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conocimiento_agencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones ENABLE ROW LEVEL SECURITY;

-- 2) Políticas públicas de lectura + authenticated write por tabla
-- Drop previos si existen
DROP POLICY IF EXISTS "Public read clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated write clientes" ON public.clientes;
CREATE POLICY "Public read clientes" ON public.clientes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update clientes" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete clientes" ON public.clientes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Authenticated write proyectos" ON public.proyectos;
CREATE POLICY "Public read proyectos" ON public.proyectos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write proyectos" ON public.proyectos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update proyectos" ON public.proyectos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete proyectos" ON public.proyectos FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Authenticated write oportunidades" ON public.oportunidades;
CREATE POLICY "Public read oportunidades" ON public.oportunidades FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write oportunidades" ON public.oportunidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update oportunidades" ON public.oportunidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete oportunidades" ON public.oportunidades FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read facturas" ON public.facturas;
DROP POLICY IF EXISTS "Authenticated write facturas" ON public.facturas;
CREATE POLICY "Public read facturas" ON public.facturas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write facturas" ON public.facturas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update facturas" ON public.facturas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete facturas" ON public.facturas FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read contratos" ON public.contratos;
DROP POLICY IF EXISTS "Authenticated write contratos" ON public.contratos;
CREATE POLICY "Public read contratos" ON public.contratos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete contratos" ON public.contratos FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read tareas" ON public.tareas;
DROP POLICY IF EXISTS "Authenticated write tareas" ON public.tareas;
CREATE POLICY "Public read tareas" ON public.tareas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write tareas" ON public.tareas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update tareas" ON public.tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete tareas" ON public.tareas FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read transacciones" ON public.transacciones;
DROP POLICY IF EXISTS "Authenticated write transacciones" ON public.transacciones;
CREATE POLICY "Public read transacciones" ON public.transacciones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write transacciones" ON public.transacciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update transacciones" ON public.transacciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete transacciones" ON public.transacciones FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read configuracion_empresa" ON public.configuracion_empresa;
DROP POLICY IF EXISTS "Authenticated write configuracion_empresa" ON public.configuracion_empresa;
CREATE POLICY "Public read configuracion_empresa" ON public.configuracion_empresa FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write configuracion_empresa" ON public.configuracion_empresa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update configuracion_empresa" ON public.configuracion_empresa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete configuracion_empresa" ON public.configuracion_empresa FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read campanas_email" ON public.campanas_email;
DROP POLICY IF EXISTS "Authenticated write campanas_email" ON public.campanas_email;
CREATE POLICY "Public read campanas_email" ON public.campanas_email FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write campanas_email" ON public.campanas_email FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update campanas_email" ON public.campanas_email FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete campanas_email" ON public.campanas_email FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read plantillas_email" ON public.plantillas_email;
DROP POLICY IF EXISTS "Authenticated write plantillas_email" ON public.plantillas_email;
CREATE POLICY "Public read plantillas_email" ON public.plantillas_email FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write plantillas_email" ON public.plantillas_email FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update plantillas_email" ON public.plantillas_email FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete plantillas_email" ON public.plantillas_email FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read prompts_ai" ON public.prompts_ai;
DROP POLICY IF EXISTS "Authenticated write prompts_ai" ON public.prompts_ai;
CREATE POLICY "Public read prompts_ai" ON public.prompts_ai FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write prompts_ai" ON public.prompts_ai FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update prompts_ai" ON public.prompts_ai FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete prompts_ai" ON public.prompts_ai FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read conocimiento_agencia" ON public.conocimiento_agencia;
DROP POLICY IF EXISTS "Authenticated write conocimiento_agencia" ON public.conocimiento_agencia;
CREATE POLICY "Public read conocimiento_agencia" ON public.conocimiento_agencia FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write conocimiento_agencia" ON public.conocimiento_agencia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update conocimiento_agencia" ON public.conocimiento_agencia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete conocimiento_agencia" ON public.conocimiento_agencia FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read interacciones" ON public.interacciones;
DROP POLICY IF EXISTS "Authenticated write interacciones" ON public.interacciones;
CREATE POLICY "Public read interacciones" ON public.interacciones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write interacciones" ON public.interacciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update interacciones" ON public.interacciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete interacciones" ON public.interacciones FOR DELETE TO authenticated USING (true);
