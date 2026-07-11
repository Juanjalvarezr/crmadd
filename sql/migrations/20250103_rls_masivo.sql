-- Verificación y reaplicación segura de RLS masiva
-- Idempotente: revisa existencia antes de crear política por política

DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'clientes','proyectos','oportunidades','facturas','contratos',
    'tareas','transacciones','configuracion_empresa','campanas_email',
    'plantillas_email','prompts_ai','conocimiento_agencia','interacciones'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Políticas por tabla: SELECT público, INSERT/UPDATE/DELETE authenticated
DO $$
BEGIN
  FOR pol IN SELECT unnest(ARRAY[
    'Public read clientes','Authenticated write clientes','Authenticated update clientes','Authenticated delete clientes',
    'Public read proyectos','Authenticated write proyectos','Authenticated update proyectos','Authenticated delete proyectos',
    'Public read oportunidades','Authenticated write oportunidades','Authenticated update oportunidades','Authenticated delete oportunidades',
    'Public read facturas','Authenticated write facturas','Authenticated update facturas','Authenticated delete facturas',
    'Public read contratos','Authenticated write contratos','Authenticated update contratos','Authenticated delete contratos',
    'Public read tareas','Authenticated write tareas','Authenticated update tareas','Authenticated delete tareas',
    'Public read transacciones','Authenticated write transacciones','Authenticated update transacciones','Authenticated delete transacciones',
    'Public read configuracion_empresa','Authenticated write configuracion_empresa','Authenticated update configuracion_empresa','Authenticated delete configuracion_empresa',
    'Public read campanas_email','Authenticated write campanas_email','Authenticated update campanas_email','Authenticated delete campanas_email',
    'Public read plantillas_email','Authenticated write plantillas_email','Authenticated update plantillas_email','Authenticated delete plantillas_email',
    'Public read prompts_ai','Authenticated write prompts_ai','Authenticated update prompts_ai','Authenticated delete prompts_ai',
    'Public read conocimiento_agencia','Authenticated write conocimiento_agencia','Authenticated update conocimiento_agencia','Authenticated delete conocimiento_agencia',
    'Public read interacciones','Authenticated write interacciones','Authenticated update interacciones','Authenticated delete interacciones'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', pol, split_part(pol, ' ', 4));
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Recrear políticas clave aleatorias select
CREATE POLICY "Public read clientes" ON public.clientes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update clientes" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete clientes" ON public.clientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read proyectos" ON public.proyectos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write proyectos" ON public.proyectos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update proyectos" ON public.proyectos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete proyectos" ON public.proyectos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read oportunidades" ON public.oportunidades FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write oportunidades" ON public.oportunidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update oportunidades" ON public.oportunidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete oportunidades" ON public.oportunidades FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read facturas" ON public.facturas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write facturas" ON public.facturas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update facturas" ON public.facturas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete facturas" ON public.facturas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read contratos" ON public.contratos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete contratos" ON public.contratos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read tareas" ON public.tareas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write tareas" ON public.tareas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update tareas" ON public.tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete tareas" ON public.tareas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read transacciones" ON public.transacciones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write transacciones" ON public.transacciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update transacciones" ON public.transacciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete transacciones" ON public.transacciones FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read configuracion_empresa" ON public.configuracion_empresa FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write configuracion_empresa" ON public.configuracion_empresa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update configuracion_empresa" ON public.configuracion_empresa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete configuracion_empresa" ON public.configuracion_empresa FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read campanas_email" ON public.campanas_email FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write campanas_email" ON public.campanas_email FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update campanas_email" ON public.campanas_email FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete campanas_email" ON public.campanas_email FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read plantillas_email" ON public.plantillas_email FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write plantillas_email" ON public.plantillas_email FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update plantillas_email" ON public.plantillas_email FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete plantillas_email" ON public.plantillas_email FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read prompts_ai" ON public.prompts_ai FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write prompts_ai" ON public.prompts_ai FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update prompts_ai" ON public.prompts_ai FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete prompts_ai" ON public.prompts_ai FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read conocimiento_agencia" ON public.conocimiento_agencia FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write conocimiento_agencia" ON public.conocimiento_agencia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update conocimiento_agencia" ON public.conocimiento_agencia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete conocimiento_agencia" ON public.conocimiento_agencia FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read interacciones" ON public.interacciones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated write interacciones" ON public.interacciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update interacciones" ON public.interacciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete interacciones" ON public.interacciones FOR DELETE TO authenticated USING (true);
