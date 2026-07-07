-- Mejoras ejecutables para módulo de ventas / pipeline
-- Idempotente: usa ADD COLUMN IF NOT EXISTS y CREATE TABLE IF NOT EXISTS

BEGIN;

-- 1) Extender oportunidades para vincular agente, meta y campos de pérdida/seguimiento
ALTER TABLE IF EXISTS public.oportunidades
  ADD COLUMN IF NOT EXISTS agente_id TEXT,
  ADD COLUMN IF NOT EXISTS agente_nombre TEXT,
  ADD COLUMN IF NOT EXISTS motivo_perdida TEXT CHECK (motivo_perdida IS NULL OR motivo_perdida IN ('Precio','Producto','Plazo','Confianza','Cambio de decisión','Otro')),
  ADD COLUMN IF NOT EXISTS motivo_perdida_detalle TEXT,
  ADD COLUMN IF NOT EXISTS meta_id TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cierre_esperada DATE;

-- Si ya existía la tabla contratos desde supabase_setup con definición antigua,
-- creamos columnas faltantes
ALTER TABLE IF EXISTS public.contratos
  ADD COLUMN IF NOT EXISTS fecha_renovacion DATE,
  ADD COLUMN IF NOT EXISTS alerta_renovacion_dias INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS firmado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS firma_datos JSONB,
  ADD COLUMN IF NOT EXISTS bloqueado_post_firma BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS obligaciones JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vencimientos JSONB DEFAULT '[]'::jsonb;

-- 2) Seguimientos de ventas (follow-up, no toca tareas existentes)
CREATE TABLE IF NOT EXISTS public.oportunidad_seguimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oportunidad_id INTEGER REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'Nota' CHECK (tipo IN ('Cita','Llamada','WhatsApp','Email','Nota')),
  nota TEXT NOT NULL,
  usuario TEXT DEFAULT 'Asistente IA',
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Metas por agente y mes
CREATE TABLE IF NOT EXISTS public.metas_ventas (
  id TEXT DEFAULT gen_random_uuid() PRIMARY KEY,
  agente_nombre TEXT NOT NULL,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  valor_meta BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agente_nombre, anio, mes)
);

-- 4) Plantillas de cotización (documentos para ventas)
CREATE TABLE IF NOT EXISTS public.plantillas_cotizacion (
  id TEXT DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  contenido TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Índices
CREATE INDEX IF NOT EXISTS idx_oportunidad_seguimientos_oportunidad ON public.oportunidad_seguimientos(oportunidad_id);
CREATE INDEX IF NOT EXISTS idx_metas_ventas_agente ON public.metas_ventas(agente_nombre, anio, mes);
CREATE INDEX IF NOT EXISTS idx_plantillas_cotizacion_activa ON public.plantillas_cotizacion(activa);

-- 6) RLS
ALTER TABLE IF EXISTS public.oportunidad_seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.metas_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plantillas_cotizacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all oportunidad_seguimientos" ON public.oportunidad_seguimientos;
DROP POLICY IF EXISTS "Allow all metas_ventas" ON public.metas_ventas;
DROP POLICY IF EXISTS "Allow all plantillas_cotizacion" ON public.plantillas_cotizacion;

CREATE POLICY "Allow all oportunidad_seguimientos" ON public.oportunidad_seguimientos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all metas_ventas" ON public.metas_ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all plantillas_cotizacion" ON public.plantillas_cotizacion FOR ALL USING (true) WITH CHECK (true);

COMMIT;
