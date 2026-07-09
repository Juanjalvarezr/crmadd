-- Migration: add strategy/channels/billing columns to proyectos
-- Execute as one-off in Supabase SQL Editor

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proyectos' AND column_name='estrategia') THEN
    ALTER TABLE public.proyectos ADD COLUMN estrategia JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proyectos' AND column_name='canales') THEN
    ALTER TABLE public.proyectos ADD COLUMN canales JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proyectos' AND column_name='contrato_url') THEN
    ALTER TABLE public.proyectos ADD COLUMN contrato_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proyectos' AND column_name='facturacion_detalle') THEN
    ALTER TABLE public.proyectos ADD COLUMN facturacion_detalle JSONB DEFAULT '{
      "cuotas": [],
      "monto_total": 0,
      "monto_pagado": 0,
      "estado": "pendiente"
    }'::jsonb;
  END IF;
END $$;

-- Indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_proyectos_estrategia ON public.proyectos USING gin (estrategia);
CREATE INDEX IF NOT EXISTS idx_proyectos_canales ON public.proyectos USING gin (canales);
