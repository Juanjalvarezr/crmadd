-- Migration: add codigo column to clientes, proyectos, oportunidades, facturas
-- Execute as one-off in Supabase SQL Editor

DO $$ BEGIN
  -- clientes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='codigo') THEN
    ALTER TABLE public.clientes ADD COLUMN codigo TEXT;
  END IF;

  -- proyectos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proyectos' AND column_name='codigo') THEN
    ALTER TABLE public.proyectos ADD COLUMN codigo TEXT;
  END IF;

  -- oportunidades
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='oportunidades' AND column_name='codigo') THEN
    ALTER TABLE public.oportunidades ADD COLUMN codigo TEXT;
  END IF;

  -- facturas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facturas' AND column_name='codigo') THEN
    ALTER TABLE public.facturas ADD COLUMN codigo TEXT;
  END IF;
END $$;

-- Backfill existing rows with generated codes
UPDATE public.clientes SET codigo = 'CLI-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') WHERE codigo IS NULL;
UPDATE public.proyectos SET codigo = 'PRY-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') WHERE codigo IS NULL;
UPDATE public.oportunidades SET codigo = 'OPP-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') WHERE codigo IS NULL;
UPDATE public.facturas SET codigo = 'FAC-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') WHERE codigo IS NULL;

-- Add unique constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_codigo_unique') THEN
    ALTER TABLE public.clientes ADD CONSTRAINT clientes_codigo_unique UNIQUE (codigo);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proyectos_codigo_unique') THEN
    ALTER TABLE public.proyectos ADD CONSTRAINT proyectos_codigo_unique UNIQUE (codigo);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oportunidades_codigo_unique') THEN
    ALTER TABLE public.oportunidades ADD CONSTRAINT oportunidades_codigo_unique UNIQUE (codigo);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'facturas_codigo_unique') THEN
    ALTER TABLE public.facturas ADD CONSTRAINT facturas_codigo_unique UNIQUE (codigo);
  END IF;
END $$;

-- Create sequences for future inserts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename='clientes_codigo_seq') THEN
    CREATE SEQUENCE public.clientes_codigo_seq START 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename='proyectos_codigo_seq') THEN
    CREATE SEQUENCE public.proyectos_codigo_seq START 101;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename='oportunidades_codigo_seq') THEN
    CREATE SEQUENCE public.oportunidades_codigo_seq START 1001;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename='facturas_codigo_seq') THEN
    CREATE SEQUENCE public.facturas_codigo_seq START 1;
  END IF;
END $$;

-- Set default values for future inserts
ALTER TABLE public.clientes ALTER COLUMN codigo SET DEFAULT 'CLI-' || LPAD(nextval('public.clientes_codigo_seq')::text, 3, '0');
ALTER TABLE public.proyectos ALTER COLUMN codigo SET DEFAULT 'PRY-' || LPAD(nextval('public.proyectos_codigo_seq')::text, 3, '0');
ALTER TABLE public.oportunidades ALTER COLUMN codigo SET DEFAULT 'OPP-' || LPAD(nextval('public.oportunidades_codigo_seq')::text, 4, '0');
ALTER TABLE public.facturas ALTER COLUMN codigo SET DEFAULT 'FAC-' || LPAD(nextval('public.facturas_codigo_seq')::text, 3, '0');
