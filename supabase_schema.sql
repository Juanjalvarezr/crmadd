CREATE TABLE IF NOT EXISTS clientes (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  email text UNIQUE NOT NULL,
  telefono text,
  empresa text,
  nicho text,
  origen text,
  dolores text,
  necesidades text,
  intereses text,
  estado text DEFAULT 'Activo',
  ultima_interaccion text,
  favorito boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipo (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  email text UNIQUE NOT NULL,
  rol text NOT NULL,
  especialidad text,
  estado text DEFAULT 'Activo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicios (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  descripcion text,
  precio_base numeric DEFAULT 0,
  duracion text,
  incluye text[],
  estado text DEFAULT 'Activo',
  popularidad int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proyectos (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  cliente_id int REFERENCES clientes(id),
  cliente_nombre text,
  servicios text[] DEFAULT '{}',
  oportunidad_id int,
  estado text DEFAULT 'planificacion',
  prioridad text DEFAULT 'media',
  fecha_inicio text,
  fecha_fin text,
  progreso int DEFAULT 0,
  presupuesto numeric DEFAULT 0,
  costo_actual numeric DEFAULT 0,
  tareas jsonb DEFAULT '[]',
  recursos jsonb DEFAULT '[]',
  monto_pagado numeric DEFAULT 0,
  onboarding_checklist jsonb DEFAULT '{}',
  estado_pago text DEFAULT 'pendiente',
  metodo_pago text,
  fase_administrativa text DEFAULT 'propuesta',
  plan_contenido jsonb DEFAULT '{"reels":[],"stories":[],"pauta":[]}',
  creado_en timestamptz DEFAULT now(),
  actualizado_en timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facturas (
  id serial PRIMARY KEY,
  numero_factura text,
  proyecto_id text REFERENCES proyectos(id),
  cliente_id int REFERENCES clientes(id),
  estado text DEFAULT 'Borrador',
  total numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  descuento numeric DEFAULT 0,
  metodo_pago text,
  notas text,
  fecha_emision text,
  fecha_vencimiento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pagos (
  id serial PRIMARY KEY,
  factura_id int REFERENCES facturas(id),
  monto numeric NOT NULL,
  fecha_pago text,
  metodo_pago text,
  referencia text,
  comprobante_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contratos (
  id serial PRIMARY KEY,
  proyecto_id text REFERENCES proyectos(id),
  cliente_id int REFERENCES clientes(id),
  factura_id int,
  estado text DEFAULT 'Activo',
  fecha_inicio text,
  fecha_fin text,
  valor numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transacciones (
  id serial PRIMARY KEY,
  proyecto_id text REFERENCES proyectos(id),
  cliente_id int REFERENCES clientes(id),
  tipo text NOT NULL,
  monto numeric NOT NULL,
  concepto text,
  fecha text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipo DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicios DISABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE facturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE contratos DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones DISABLE ROW LEVEL SECURITY;

INSERT INTO clientes (nombre, email, telefono, empresa, nicho, estado, favorito)
VALUES ('Juan Jose Alvarez', 'juanjosealvarez@gmail.com', '320 369 8476', 'DESEO DIGITAL', 'Tecnología', 'Activo', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO equipo (nombre, email, rol, especialidad, estado)
VALUES
('Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia', 'Activo'),
('Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web', 'Activo'),
('Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Branding', 'Activo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad)
VALUES
('Diseño Web Profesional', 'Desarrollo', 'Landing page o sitio corporativo', 2500000, '2 semanas', ARRAY['Diseño responsive','SEO básico','Hosting 1 año'], 'Activo', 5),
('Desarrollo Full Stack', 'Desarrollo', 'App web o móvil completa', 8500000, '1 mes', ARRAY['Frontend','Backend','Base de datos','Despliegue'], 'Activo', 4),
('SEO Optimization', 'Marketing', 'Auditoría y optimización SEO', 1200000, '1 semana', ARRAY['Auditoría','Keywords','Reporte mensual'], 'Activo', 3)
ON CONFLICT DO NOTHING;

INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, estado_pago, fase_administrativa)
SELECT 'PROJ-001', 'Agencia Deseo Digital', 'Proyecto interno CRM', id, 'DESEO DIGITAL', ARRAY['Diseño Web Profesional'], 'en_progreso', 'alta', '2026-06-01', '2026-12-31', 30, 15000000, 4500000, 'parcial', 'operacion'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO facturas (numero_factura, proyecto_id, cliente_id, estado, total, subtotal, iva, descuento, metodo_pago, fecha_emision, fecha_vencimiento)
SELECT 'FAC-001', 'PROJ-001', id, 'Enviada', 15000000, 12500000, 2500000, 0, 'transferencia', '2026-06-05', '2026-07-05'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO pagos (factura_id, monto, metodo_pago, referencia, fecha_pago)
SELECT 1, 4500000, 'transferencia', 'REF-001', '2026-06-06'
WHERE EXISTS (SELECT 1 FROM facturas WHERE numero_factura = 'FAC-001');

INSERT INTO contratos (proyecto_id, cliente_id, factura_id, estado, valor, fecha_inicio, fecha_fin)
SELECT 'PROJ-001', id, 1, 15000000, '2026-06-01', '2026-12-31'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, concepto, fecha)
SELECT 'PROJ-001', id, 'Ingreso', 4500000, 'Pago inicial', '2026-06-06'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, concepto, fecha)
SELECT 'PROJ-001', id, 'Egreso', 1200000, 'Hosting y dominio', '2026-06-10'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;
