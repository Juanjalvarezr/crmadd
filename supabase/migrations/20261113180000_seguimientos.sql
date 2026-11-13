-- Seguimiento automatico (24h / 3d / 7d) - lo lee n8n y lo envia por WhatsApp
CREATE TABLE IF NOT EXISTS public.seguimientos (
  id bigserial PRIMARY KEY,
  cliente_id bigint,
  cliente_nombre text,
  telefono text,
  tipo text,
  mensaje text,
  programado_para timestamptz,
  estado text DEFAULT 'pendiente',
  creado_en timestamptz DEFAULT now()
);
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_select_seguimientos" ON public.seguimientos;
CREATE POLICY "crm_select_seguimientos" ON public.seguimientos FOR SELECT USING (true);
DROP POLICY IF EXISTS "crm_insert_seguimientos" ON public.seguimientos;
CREATE POLICY "crm_insert_seguimientos" ON public.seguimientos FOR INSERT WITH CHECK (true);
