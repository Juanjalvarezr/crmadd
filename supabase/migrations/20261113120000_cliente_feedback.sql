-- Feedback del ciclo de vida del cliente (motivo de perdida + fecha de etapa)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS motivo_perdida text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_etapa timestamptz;
