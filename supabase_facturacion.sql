CREATE TABLE IF NOT EXISTS public.cuotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE,
  monto NUMERIC(12,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','vencida','parcial')),
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo','transferencia','tarjeta','nequi','daviplata','otro')),
  comprobante_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id),
  proyecto_id UUID REFERENCES public.proyectos(id),
  transaccion_id UUID REFERENCES public.transacciones(id),
  tipo TEXT NOT NULL DEFAULT 'servicio' CHECK (tipo IN ('servicio','producto','mixto')),
  subtotal NUMERIC(12,2) NOT NULL,
  iva NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP',
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','pagada','anulada')),
  fecha_emision DATE NOT NULL DEFAULT now(),
  fecha_vencimiento DATE NOT NULL,
  notas TEXT,
  json_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id),
  proyecto_id UUID REFERENCES public.proyectos(id),
  tipo TEXT NOT NULL DEFAULT 'prestacion_servicios' CHECK (tipo IN ('prestacion_servicios','acuerdo_confidencialidad','propiedad_intelectual','otro')),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  variables JSONB,
  numero TEXT UNIQUE,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','firmado','activo','finalizado','cancelado')),
  fecha_inicio DATE,
  fecha_fin DATE,
  valor NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_cuotas_transaccion ON public.cuotas(transaccion_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON public.cuotas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON public.facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON public.facturas(numero);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos(cliente_id);
