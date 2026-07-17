-- Tabla de eventos CRM → n8n / n8n → CRM
-- Creada para logging, trazabilidad y retroalimentación del enjambre.
CREATE TABLE IF NOT EXISTS public.n8n_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('crm_to_n8n', 'n8n_to_crm')),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed','retried')),
  error TEXT,
  retries INT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_n8n_events_direction ON public.n8n_events(direction);
CREATE INDEX IF NOT EXISTS idx_n8n_events_status ON public.n8n_events(status);
CREATE INDEX IF NOT EXISTS idx_n8n_events_event_type ON public.n8n_events(event_type);
CREATE INDEX IF NOT EXISTS idx_n8n_events_created_at ON public.n8n_events(created_at DESC);

-- RLS básico: servicio autenticado puede leer; webhook público solo inserta
ALTER TABLE public.n8n_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_events' AND policyname = 'Allow anon insert'
  ) THEN
    CREATE POLICY "Allow anon insert" ON public.n8n_events FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_events' AND policyname = 'Allow authenticated read'
  ) THEN
    CREATE POLICY "Allow authenticated read" ON public.n8n_events FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
