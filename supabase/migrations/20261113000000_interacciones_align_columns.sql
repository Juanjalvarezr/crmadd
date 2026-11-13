-- Alinea la tabla interacciones con lo que usa la app (asunto, contenido, usuario, created_at).
-- Aditivo: no rompe datos existentes.
ALTER TABLE public.interacciones ADD COLUMN IF NOT EXISTS asunto text;
ALTER TABLE public.interacciones ADD COLUMN IF NOT EXISTS contenido text;
ALTER TABLE public.interacciones ADD COLUMN IF NOT EXISTS usuario text;
ALTER TABLE public.interacciones ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Etapa del proceso comercial por cliente (nuevo, aditivo)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS etapa text;
