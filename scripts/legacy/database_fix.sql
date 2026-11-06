-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLAS BASE
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  empresa TEXT,
  nicho TEXT,
  origen TEXT, -- n8n, Instagram, Ads, Referido
  dolores TEXT, -- Problemas actuales detectados
  necesidades TEXT, -- Qué busca resolver
  intereses TEXT, -- Servicios que le llamaron la atención
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  ultima_interaccion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  descripcion TEXT,
  precio_base BIGINT NOT NULL,
  duracion TEXT,
  incluye TEXT[],
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  popularidad INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subagentes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT DEFAULT 'Soporte' CHECK (rol IN ('Admin', 'Soporte', 'Técnico', 'Creativo')),
  especialidad TEXT,
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id SERIAL PRIMARY KEY,
  nombre_agencia TEXT DEFAULT 'DESEO DIGITAL',
  email_contacto TEXT,
  telefono TEXT,
  website TEXT,
  logo_url TEXT,
  colores JSONB DEFAULT '{"primary": "#e91e63", "secondary": "#daa520"}'::jsonb,
  descripcion TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  google_business_link TEXT,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABLAS CON DEPENDENCIAS
CREATE TABLE IF NOT EXISTS oportunidades (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  valor BIGINT NOT NULL,
  servicios_interes TEXT[],
  fecha_cierre_esperada DATE,
  etapa TEXT DEFAULT 'Prospección',
  probabilidad INTEGER DEFAULT 25,
  estado TEXT DEFAULT 'Abierta' CHECK (estado IN ('Abierta', 'Cerrada', 'Perdida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proyectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  servicios TEXT[],
  oportunidad_id INTEGER REFERENCES oportunidades(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'planificacion',
  prioridad TEXT DEFAULT 'media',
  fecha_inicio DATE,
  fecha_fin DATE,
  progreso INTEGER DEFAULT 0,
  presupuesto BIGINT DEFAULT 0,
  costo_actual BIGINT DEFAULT 0,
  tareas JSONB DEFAULT '[]'::jsonb,
  recursos JSONB DEFAULT '[]'::jsonb,
  monto_pagado BIGINT DEFAULT 0,
  onboarding_checklist JSONB DEFAULT '{}'::jsonb,
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado', 'vencido')),
  metodo_pago TEXT, -- nequi, daviplata, transferencia, efectivo
  fase_administrativa TEXT DEFAULT 'operacion',
  plan_contenido JSONB DEFAULT '{}'::jsonb,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tareas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta')),
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En progreso', 'Completada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  oportunidad_id INTEGER REFERENCES oportunidades(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  responsable_id INTEGER REFERENCES subagentes(id) ON DELETE SET NULL
);

-- 4. INTERACCIONES (Trazabilidad de acciones de la IA)
CREATE TABLE IF NOT EXISTS interacciones (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('Email', 'WhatsApp', 'Nota')),
  asunto TEXT,
  contenido TEXT NOT NULL,
  usuario TEXT DEFAULT 'Asistente IA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. BASE DE CONOCIMIENTO (El "Cerebro" de la Agencia)
CREATE TABLE IF NOT EXISTS conocimiento_agencia (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT NOT NULL, -- 'operaciones', 'ventas', 'contratacion', 'templates', 'marca'
  tags TEXT[],
  embedding vector(768),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);