-- Script idempotente: se adapta a los tipos reales del proyecto
-- Cliente_id es BIGINT porque clientes.id es BIGSERIAL
-- Proyecto_id es TEXT porque proyectos.id es TEXT según tu base actual

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_factura') THEN
    CREATE TYPE tipo_factura AS ENUM ('servicio','producto','mixto');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_factura') THEN
    CREATE TYPE estado_factura AS ENUM ('borrador','enviada','pagada','anulada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_contrato') THEN
    CREATE TYPE tipo_contrato AS ENUM ('prestacion_servicios','acuerdo_confidencialidad','propiedad_intelectual','otro');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_contrato') THEN
    CREATE TYPE estado_contrato AS ENUM ('borrador','firmado','activo','finalizado','cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_cuota') THEN
    CREATE TYPE estado_cuota AS ENUM ('pendiente','pagada','vencida','parcial');
  END IF;
END $$;

-- facturas: crea solo si no existe
CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_id BIGINT REFERENCES public.clientes(id),
  proyecto_id TEXT REFERENCES public.proyectos(id),
  transaccion_id UUID REFERENCES public.transacciones(id),
  tipo tipo_factura NOT NULL DEFAULT 'servicio',
  subtotal NUMERIC(12,2) NOT NULL,
  iva NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP',
  estado estado_factura NOT NULL DEFAULT 'borrador',
  fecha_emision DATE NOT NULL DEFAULT now(),
  fecha_vencimiento DATE,
  notas TEXT,
  motivo_anulacion TEXT,
  json_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- contratos: crea solo si no existe
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id BIGINT REFERENCES public.clientes(id),
  proyecto_id TEXT REFERENCES public.proyectos(id),
  tipo tipo_contrato NOT NULL DEFAULT 'prestacion_servicios',
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  variables JSONB,
  numero TEXT UNIQUE,
  estado estado_contrato NOT NULL DEFAULT 'borrador',
  fecha_inicio DATE,
  fecha_fin DATE,
  valor NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- cuotas: crea solo si no existe
CREATE TABLE IF NOT EXISTS public.cuotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE,
  monto NUMERIC(12,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado estado_cuota NOT NULL DEFAULT 'pendiente',
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo','transferencia','tarjeta','nequi','daviplata','otro')),
  comprobante_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE IF EXISTS public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cuotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all facturas" ON public.facturas;
DROP POLICY IF EXISTS "Allow all contratos" ON public.contratos;
DROP POLICY IF EXISTS "Allow all cuotas" ON public.cuotas;

CREATE POLICY "Allow all facturas" ON public.facturas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contratos" ON public.contratos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all cuotas" ON public.cuotas FOR ALL USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON public.facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_proyecto ON public.facturas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON public.facturas(numero);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_proyecto ON public.contratos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_transaccion ON public.cuotas(transaccion_id);