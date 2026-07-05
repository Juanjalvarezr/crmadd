-- Tabla: transacciones
-- Control de ingresos y egresos del CRM
CREATE TABLE IF NOT EXISTS public.transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria TEXT NOT NULL CHECK (categoria IN ('nomina','suscripcion','servicio','otro')),
  monto NUMERIC NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP',
  forma_pago TEXT NOT NULL DEFAULT 'transferencia' CHECK (forma_pago IN ('efectivo','transferencia','tarjeta')),
  descripcion TEXT,
  comprobante_url TEXT,
  fecha DATE NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON public.transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON public.transacciones(fecha DESC);

-- Row Level Security
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access" ON public.transacciones FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.transacciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.transacciones FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON public.transacciones FOR DELETE USING (true);
