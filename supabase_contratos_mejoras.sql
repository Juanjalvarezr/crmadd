-- Mejoras para módulo de contratos
-- Plantillas parametrizables, versionado, alertas de renovación, firma simulada,
-- export multi-canal, vinculación proyecto/facturas, cláusulas predefinidas,
-- bloqueo post-firma, obligaciones y vencimientos.

BEGIN;

-- 1) Extender tabla contratos
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS fecha_renovacion DATE,
  ADD COLUMN IF NOT EXISTS alerta_renovacion_dias INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS firmado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS firma_datos JSONB,
  ADD COLUMN IF NOT EXISTS bloqueado_post_firma BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS obligaciones JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vencimientos JSONB DEFAULT '[]'::jsonb;

-- 2) Historial / versiones
CREATE TABLE IF NOT EXISTS public.contrato_versiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  contenido TEXT NOT NULL,
  variables JSONB,
  cambios JSONB,
  usuario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Cláusulas predefinidas
CREATE TABLE IF NOT EXISTS public.contrato_clausulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo tipo_contrato,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contrato_versiones_contrato ON public.contrato_versiones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_clausulas_tipo ON public.contrato_clausulas(tipo);

-- RLS
ALTER TABLE IF EXISTS public.contrato_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contrato_clausulas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all contrato_versiones" ON public.contrato_versiones;
DROP POLICY IF EXISTS "Allow all contrato_clausulas" ON public.contrato_clausulas;

CREATE POLICY "Allow all contrato_versiones" ON public.contrato_versiones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contrato_clausulas" ON public.contrato_clausulas FOR ALL USING (true) WITH CHECK (true);

-- Seed cláusulas predefinidas por tipo
INSERT INTO public.contrato_clausulas (tipo, titulo, contenido, orden) VALUES
('prestacion_servicios', 'Objeto del contrato', 'El prestador se obliga a ejecutar los servicios descritos en la cláusula primera del presente contrato.', 1),
('prestacion_servicios', 'Obligaciones del cliente', 'El cliente se obliga a suministrar información veraz, oportuna y realizar los pagos en las fechas acordadas.', 2),
('prestacion_servicios', 'Confidencialidad', 'Las partes acuerdan mantener confidencialidad sobre la información intercambiada durante la vigencia del contrato.', 3),
('prestacion_servicios', 'Propiedad intelectual', 'Los trabajos desarrollados serán propiedad del cliente una vez se haya realizado el pago total.', 4),
('acuerdo_confidencialidad', 'Definición de información confidencial', 'Se considera información confidencial todos los datos técnicos, comerciales y estratégicos compartidos.', 1),
('acuerdo_confidencialidad', 'Plazo de confidencialidad', 'La obligación de confidencialidad tendrá una duración de 2 años a partir de la firma del acuerdo.', 2),
('propiedad_intelectual', 'Titularidad', 'El autor transfiere al cliente los derechos patrimoniales de la obra una vez se cumplan las condiciones de pago.', 1),
('propiedad_intelectual', 'Uso de marca', 'El cliente autoriza el uso de su marca únicamente para los fines establecidos en este contrato.', 2),
('otro', 'General', 'Las partes establecen las condiciones generales aplicables al presente acuerdo.', 1);

COMMIT;
