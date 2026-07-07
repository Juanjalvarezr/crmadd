
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS clientes (
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
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  ultima_interaccion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  favorito BOOLEAN DEFAULT FALSE
);

CREATE TABLE equipo (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('Admin','Soporte','Técnico','Creativo')),
  especialidad TEXT,
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE servicios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  descripcion TEXT,
  precio_base BIGINT NOT NULL DEFAULT 0,
  duracion TEXT,
  incluye TEXT[] DEFAULT '{}',
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  popularidad INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE configuracion_empresa (
  id BIGSERIAL PRIMARY KEY,
  nombre_agencia TEXT DEFAULT 'DESEO DIGITAL',
  email_contacto TEXT,
  telefono TEXT,
  website TEXT,
  logo_url TEXT,
  colores JSONB DEFAULT '{"primary":"#e91e63","secondary":"#daa520"}'::jsonb,
  descripcion TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  google_business_link TEXT,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE oportunidades (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  valor BIGINT NOT NULL DEFAULT 0,
  servicios_interes TEXT[] DEFAULT '{}',
  fecha_cierre_esperada DATE,
  etapa TEXT DEFAULT 'Prospección',
  probabilidad INTEGER DEFAULT 25,
  estado TEXT DEFAULT 'Abierta' CHECK (estado IN ('Abierta','Cerrada','Perdida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE proyectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  servicios TEXT[] DEFAULT '{}',
  oportunidad_id INTEGER REFERENCES oportunidades(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'planificacion',
  prioridad TEXT DEFAULT 'media',
  fecha_inicio DATE,
  fecha_fin DATE,
  progreso INTEGER DEFAULT 0 CHECK (progreso BETWEEN 0 AND 100),
  presupuesto BIGINT DEFAULT 0,
  costo_actual BIGINT DEFAULT 0,
  tareas JSONB DEFAULT '[]'::jsonb,
  recursos JSONB DEFAULT '[]'::jsonb,
  monto_pagado BIGINT DEFAULT 0,
  onboarding_checklist JSONB DEFAULT '{}'::jsonb,
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','parcial','pagado','vencido')),
  metodo_pago TEXT,
  fase_administrativa TEXT DEFAULT 'operacion',
  plan_contenido JSONB DEFAULT '{"reels":[],"stories":[],"pauta":[]}'::jsonb,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE tareas (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja','Media','Alta')),
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','En progreso','Completada')),
  tipo TEXT DEFAULT 'Tarea' CHECK (tipo IN ('Tarea','Cita','Llamada','Seguimiento')),
  link_reunion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  oportunidad_id INTEGER REFERENCES oportunidades(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  responsable_id INTEGER REFERENCES equipo(id) ON DELETE SET NULL
);

CREATE TABLE campanas_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT,
  contenido TEXT,
  tipo TEXT,
  destinatarios TEXT[] DEFAULT '{}',
  fecha_envio TIMESTAMP WITH TIME ZONE,
  estado TEXT DEFAULT 'borrador',
  estadisticas JSONB DEFAULT '{"enviados":0,"abiertos":0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE plantillas_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT,
  contenido TEXT,
  categoria TEXT,
  usos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE reglas_negocio_ai (
  id BIGSERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  instruccion TEXT NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE conocimiento_agencia (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  embedding vector(768),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE interacciones (
  id BIGSERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('Email','WhatsApp','Nota','Cita')),
  asunto TEXT,
  contenido TEXT NOT NULL,
  usuario TEXT DEFAULT 'Asistente IA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE prompts_ai (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalle JSONB,
  usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_negocio_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE conocimiento_agencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON equipo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON servicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON configuracion_empresa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON oportunidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON proyectos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tareas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON campanas_email FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON plantillas_email FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reglas_negocio_ai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conocimiento_agencia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON interacciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON prompts_ai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION actualizar_ultima_interaccion() RETURNS TRIGGER AS $$
BEGIN
  UPDATE clientes SET ultima_interaccion = NEW.created_at WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_ultima_interaccion ON interacciones;
CREATE TRIGGER trg_actualizar_ultima_interaccion AFTER INSERT ON interacciones FOR EACH ROW EXECUTE FUNCTION actualizar_ultima_interaccion();

CREATE OR REPLACE FUNCTION buscar_conocimiento(query_embedding vector(768), match_threshold float, match_count int) RETURNS TABLE (id int, titulo text, contenido text, categoria text, similarity float) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT ca.id, ca.titulo, ca.contenido, ca.categoria, 1 - (ca.embedding <=> query_embedding) AS similarity FROM conocimiento_agencia ca WHERE 1 - (ca.embedding <=> query_embedding) > match_threshold ORDER BY similarity DESC LIMIT match_count;
END;
$$;

CREATE INDEX idx_clientes_estado ON clientes(estado);
CREATE INDEX idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado);
CREATE INDEX idx_oportunidades_cliente_id ON oportunidades(cliente_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_cliente_id ON proyectos(cliente_id);
CREATE INDEX idx_tareas_estado ON tareas(estado);
CREATE INDEX idx_tareas_proyecto_id ON tareas(proyecto_id);
CREATE INDEX idx_interacciones_cliente_id ON interacciones(cliente_id);
CREATE INDEX idx_oportunidades_abiertas ON oportunidades(etapa) WHERE estado = 'Abierta';
CREATE INDEX idx_proyectos_activos ON proyectos(estado) WHERE estado IN ('planificacion','en_progreso','pausado');
CREATE INDEX idx_tareas_pendientes ON tareas(estado) WHERE estado = 'Pendiente';
CREATE INDEX idx_clientes_activos ON clientes(estado) WHERE estado = 'Activo';

CREATE VIEW vista_proyectos_cliente AS SELECT p.id, p.nombre, p.descripcion, p.cliente_id, p.cliente_nombre, p.servicios, p.oportunidad_id, p.estado, p.prioridad, p.fecha_inicio, p.fecha_fin, p.progreso, p.presupuesto, p.costo_actual, p.tareas, p.recursos, p.monto_pagado, p.onboarding_checklist, p.estado_pago, p.metodo_pago, p.fase_administrativa, p.plan_contenido, p.creado_en, p.actualizado_en, c.email AS cliente_email, c.telefono AS cliente_telefono, c.empresa AS cliente_empresa FROM proyectos p LEFT JOIN clientes c ON p.cliente_id = c.id;

CREATE VIEW vista_tareas_completas AS SELECT t.id, t.titulo, t.descripcion, t.fecha, t.prioridad, t.estado, t.created_at, t.proyecto_id, t.oportunidad_id, t.cliente_id, t.responsable_id, c.nombre AS cliente_nombre, e.nombre AS responsable_nombre FROM tareas t LEFT JOIN clientes c ON t.cliente_id = c.id LEFT JOIN equipo e ON t.responsable_id = e.id;

CREATE VIEW vista_kpi_dashboard AS SELECT (SELECT COUNT(*) FROM clientes WHERE estado = 'Activo') AS clientes_activos, (SELECT COUNT(*) FROM proyectos WHERE estado IN ('planificacion','en_progreso','pausado')) AS proyectos_activos, (SELECT COUNT(*) FROM tareas WHERE estado = 'Pendiente') AS tareas_pendientes, (SELECT COUNT(*) FROM oportunidades WHERE estado = 'Abierta') AS oportunidades_abiertas, (SELECT COALESCE(SUM(presupuesto),0) FROM proyectos) AS presupuesto_total;

INSERT INTO equipo (nombre, email, rol, especialidad) VALUES ('Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia'), ('Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web'), ('Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Branding');

INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad) VALUES ('Diseño Web Profesional', 'Desarrollo', 'Landing page o sitio corporativo', 2500000, '2 semanas', ARRAY['Diseño responsive','SEO básico','Hosting 1 año'], 'Activo', 5), ('Desarrollo Full Stack', 'Desarrollo', 'App web o móvil completa', 8500000, '1 mes', ARRAY['Frontend','Backend','Base de datos','Despliegue'], 'Activo', 4), ('SEO Optimization', 'Marketing', 'Auditoría y optimización SEO', 1200000, '1 semana', ARRAY['Auditoría','Keywords','Reporte mensual'], 'Activo', 3);

INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, descripcion, direccion, ciudad, pais) VALUES ('DESEO DIGITAL', 'contacto@deseodigital.com', '320 369 8476', 'https://deseodigital.com', 'Agencia especializada en Marketing Digital y SEO', 'Calle 10 #20-30', 'Medellín', 'Colombia');

INSERT INTO reglas_negocio_ai (categoria, instruccion) VALUES ('ventas', 'Siempre mencionar el anticipo del 50% antes de empezar proyecto'), ('operaciones', 'Validar disponibilidad de equipo antes de asignar tarea'), ('branding', 'Usar solo la paleta de colores oficial de la agencia');

INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template) VALUES ('prompt_001', 'director_estrategico', 'Eres el Director Estratégico Senior de DESEO DIGITAL.', 'Redacta una propuesta persuasiva para {{clienteNombre}}. Servicios: {{servicios}}. Enfócate en el ROI y el anticipo del 50%.'), ('prompt_002', 'cfo_agencia', 'Eres el CFO de DESEO DIGITAL.', 'Analiza el flujo de caja. Anticipos recaudados: {{montoPagado}}. Presupuesto total: {{presupuesto}}.'), ('prompt_003', 'content_lead', 'Eres el Content Lead de DESEO DIGITAL.', 'Genera 4 ideas de Reels y 5 Stories para {{clienteNombre}}. Recuerda que Jessica López edita los Reels.');

INSERT INTO clientes (nombre, email, telefono, empresa, nicho, origen, dolores, necesidades, intereses, estado, favorito) VALUES ('María García', 'maria@empresa.com', '3001112233', 'Empresa A', 'E-commerce', 'Instagram', 'Bajo engagement', 'Más ventas online', 'SEO, Social Media', 'Activo', TRUE), ('Carlos López', 'carlos@negocio.com', '3004445566', 'Negocio B', 'Restaurante', 'Referido', 'Poca visibilidad local', 'Clientes nuevos', 'Google Ads, Diseño Web', 'Activo', FALSE), ('Ana Martínez', 'ana@startup.com', '3007778899', 'Startup C', 'SaaS', 'LinkedIn', 'Escala difícil', 'Automatización', 'CRM, Capacitación', 'Inactivo', FALSE);
