-- Migration: hierarchical codes for clientes, proyectos, oportunidades, facturas
-- Execute as one-off in Supabase SQL Editor

-- Backfill (run these 4 first)
UPDATE public.clientes c SET codigo = 'CLI-' || LPAD(n.rn::text, 3, '0')
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM public.clientes) n
WHERE c.id = n.id AND c.codigo IS NULL;

UPDATE public.proyectos p SET codigo = 'PRY-' || LPAD(n.rn::text, 3, '0')
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM public.proyectos) n
WHERE p.id = n.id AND p.codigo IS NULL;

UPDATE public.oportunidades o SET codigo = 'OPP-' || LPAD(n.rn::text, 4, '0')
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM public.oportunidades) n
WHERE o.id = n.id AND o.codigo IS NULL;

UPDATE public.facturas f SET codigo = 'FAC-' || LPAD(n.rn::text, 3, '0')
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM public.facturas) n
WHERE f.id = n.id AND f.codigo IS NULL;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS public.clientes_codigo_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.proyectos_codigo_seq START 101;
CREATE SEQUENCE IF NOT EXISTS public.oportunidades_codigo_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS public.facturas_codigo_seq START 1;

-- Defaults
ALTER TABLE public.clientes ALTER COLUMN codigo SET DEFAULT 'CLI-' || LPAD(nextval('public.clientes_codigo_seq')::text, 3, '0');
ALTER TABLE public.proyectos ALTER COLUMN codigo SET DEFAULT 'PRY-' || LPAD(nextval('public.proyectos_codigo_seq')::text, 3, '0');
ALTER TABLE public.oportunidades ALTER COLUMN codigo SET DEFAULT 'OPP-' || LPAD(nextval('public.oportunidades_codigo_seq')::text, 4, '0');
ALTER TABLE public.facturas ALTER COLUMN codigo SET DEFAULT 'FAC-' || LPAD(nextval('public.facturas_codigo_seq')::text, 3, '0');
