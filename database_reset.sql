DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS interacciones CASCADE;
DROP TABLE IF EXISTS prompts_ai CASCADE;
DROP TABLE IF EXISTS conocimiento_agencia CASCADE;
DROP TABLE IF EXISTS reglas_negocio_ai CASCADE;
DROP TABLE IF EXISTS campanas_email CASCADE;
DROP TABLE IF EXISTS plantillas_email CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS proyectos CASCADE;
DROP TABLE IF EXISTS oportunidades CASCADE;
DROP TABLE IF EXISTS configuracion_empresa CASCADE;
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS equipo CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

CREATE TABLE clientes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  empresa TEXT,
  nicho TEXT,
  origen TEXT,
  dolores TEXT,
  necesidades TEXT,
  intereses TEXT,
  estado TEXT NOT NULL DEFAULT 'Activo',
  ultima_interaccion TEXT,
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT,
  favorito BOOLEAN DEFAULT FALSE
);

CREATE TABLE equipo (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL,
  especialidad TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activo',
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE servicios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC DEFAULT 0,
  duracion TEXT,
  incluye TEXT[] DEFAULT '{}',
  estado TEXT NOT NULL DEFAULT 'Activo',
  popularidad INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE configuracion_empresa (
  id BIGSERIAL PRIMARY KEY,
  nombre_agencia TEXT NOT NULL,
  email_contacto TEXT,
  telefono TEXT,
  website TEXT,
  logo_url TEXT,
  colores JSONB,
  descripcion TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  actualizado_en TEXT NOT NULL DEFAULT NOW()::TEXT,
  google_business_link TEXT
);

CREATE TABLE oportunidades (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  valor NUMERIC DEFAULT 0,
  servicios_interes TEXT[] DEFAULT '{}',
  fecha_cierre_esperada TEXT,
  etapa TEXT,
  probabilidad INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'Abierta',
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE proyectos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  servicios TEXT[] DEFAULT '{}',
  oportunidad_id BIGINT REFERENCES oportunidades(id) ON DELETE SET NULL,
  estado TEXT,
  prioridad TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  progreso INTEGER DEFAULT 0,
  presupuesto NUMERIC DEFAULT 0,
  costo_actual NUMERIC DEFAULT 0,
  tareas JSONB DEFAULT '[]'::jsonb,
  recursos JSONB DEFAULT '[]'::jsonb,
  monto_pagado NUMERIC DEFAULT 0,
  onboarding_checklist JSONB DEFAULT '{}'::jsonb,
  estado_pago TEXT DEFAULT 'pendiente',
  metodo_pago TEXT,
  fase_administrativa TEXT DEFAULT 'propuesta',
  plan_contenido JSONB DEFAULT '{"reels":[],"stories":[],"pauta":[]}'::jsonb,
  creado_en TEXT NOT NULL DEFAULT NOW()::TEXT,
  actualizado_en TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE tareas (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TEXT,
  prioridad TEXT DEFAULT 'Media',
  estado TEXT DEFAULT 'Pendiente',
  tipo TEXT DEFAULT 'Tarea',
  link_reunion TEXT,
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT,
  proyecto_id TEXT REFERENCES proyectos(id) ON DELETE SET NULL,
  oportunidad_id BIGINT REFERENCES oportunidades(id) ON DELETE SET NULL,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  responsable_id BIGINT REFERENCES equipo(id) ON DELETE SET NULL
);

CREATE TABLE campanas_email (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  contenido TEXT,
  tipo TEXT,
  destinatarios TEXT[] DEFAULT '{}',
  fecha_envio TEXT,
  estado TEXT,
  estadisticas JSONB DEFAULT '{}'::jsonb,
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE plantillas_email (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  contenido TEXT,
  categoria TEXT,
  usos INTEGER DEFAULT 0
);

CREATE TABLE reglas_negocio_ai (
  id BIGSERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  instruccion TEXT NOT NULL,
  actualizado_en TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE conocimiento_agencia (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  embedding DOUBLE PRECISION[],
  actualizado_en TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE interacciones (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  asunto TEXT,
  contenido TEXT NOT NULL,
  usuario TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE prompts_ai (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  actualizado_en TEXT NOT NULL DEFAULT NOW()::TEXT
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalle TEXT,
  usuario TEXT,
  created_at TEXT NOT NULL DEFAULT NOW()::TEXT
);

INSERT INTO clientes (nombre, email, telefono, empresa, nicho, origen, dolores, necesidades, intereses, estado, favorito) VALUES
  ('María García', 'maria@empresa.com', '3001112233', 'Empresa A', 'E-commerce', 'Instagram', 'Bajo engagement', 'Más ventas online', 'SEO, Social Media', 'Activo', TRUE),
  ('Carlos López', 'carlos@negocio.com', '3004445566', 'Negocio B', 'Restaurante', 'Referido', 'Poca visibilidad local', 'Clientes nuevos', 'Google Ads, Diseño Web', 'Activo', FALSE),
  ('Ana Martínez', 'ana@startup.com', '3007778899', 'Startup C', 'SaaS', 'LinkedIn', 'Escala difícil', 'Automatización', 'CRM, Capacitación', 'Inactivo', FALSE);

INSERT INTO equipo (nombre, email, rol, especialidad) VALUES
  ('Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia'),
  ('Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web'),
  ('Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Branding');

INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad) VALUES
  ('Diseño Web Profesional', 'Desarrollo', 'Landing page o sitio corporativo', 2500000, '2 semanas', ARRAY['Diseño responsive','SEO básico','Hosting 1 año'], 'Activo', 5),
  ('Desarrollo Full Stack', 'Desarrollo', 'App web o móvil completa', 8500000, '1 mes', ARRAY['Frontend','Backend','Base de datos','Despliegue'], 'Activo', 4),
  ('SEO Optimization', 'Marketing', 'Auditoría y optimización SEO', 1200000, '1 semana', ARRAY['Auditoría','Keywords','Reporte mensual'], 'Activo', 3);

INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, descripcion) VALUES
  ('DESEO DIGITAL', 'contacto@deseodigital.com', '320 369 8476', 'https://deseodigital.com', 'Agencia especializada en Marketing Digital y SEO');

INSERT INTO storage.buckets (id, name, public) VALUES ('config', 'config', TRUE) ON CONFLICT (id) DO NOTHING;
