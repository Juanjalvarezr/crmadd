-- Campos de enriquecimiento de clientes (cámara de comercio / datos legales)
-- Idempotente: solo agrega columnas si no existen.
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nit text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS razon_social text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS representante_legal text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_constitucion date;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS camara_comercio text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS camara_comercio_url text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS notas_legales text;
