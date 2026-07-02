CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'SEO' CHECK (categoria IN ('SEO','SEM','Social Media','Diseño Web','Contenido','Analytics')),
  descripcion TEXT,
  precio_base BIGINT NOT NULL,
  duracion TEXT,
  incluye TEXT[],
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  popularidad INTEGER DEFAULT 3 CHECK (popularidad BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE subagentes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT DEFAULT 'Soporte' CHECK (rol IN ('Admin','Soporte','Técnico','Creativo')),
  especialidad TEXT,
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE configuracion_empresa (
  id SERIAL PRIMARY KEY,
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

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalle JSONB,
  usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE reglas_negocio_ai (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  instruccion TEXT NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE conocimiento_agencia (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[],
  embedding vector(768),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE prompts_ai (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE interacciones (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada','email','reunion','whatsapp','nota')),
  detalle TEXT,
  usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE oportunidades (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  valor BIGINT NOT NULL,
  servicios_interes TEXT[],
  fecha_cierre_esperada DATE,
  etapa TEXT DEFAULT 'Prospección',
  probabilidad INTEGER DEFAULT 25 CHECK (probabilidad BETWEEN 0 AND 100),
  estado TEXT DEFAULT 'Abierta' CHECK (estado IN ('Abierta','Cerrada','Perdida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE proyectos (
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
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','parcial','pagado','vencido')),
  metodo_pago TEXT,
  fase_administrativa TEXT DEFAULT 'operacion',
  plan_contenido JSONB DEFAULT '{"reels":[],"stories":[],"pauta":[]}'::jsonb,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE tareas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja','Media','Alta')),
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','En progreso','Completada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  oportunidad_id INTEGER REFERENCES oportunidades(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  responsable_id INTEGER REFERENCES subagentes(id) ON DELETE SET NULL
);

CREATE TABLE campanas_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT,
  contenido TEXT,
  tipo TEXT,
  destinatarios TEXT[],
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

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_negocio_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE conocimiento_agencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE subagentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON proyectos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tareas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON oportunidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON servicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON configuracion_empresa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reglas_negocio_ai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conocimiento_agencia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON prompts_ai FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subagentes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON campanas_email FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON plantillas_email FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON interacciones FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION actualizar_ultima_interaccion() RETURNS TRIGGER AS $$ BEGIN UPDATE clientes SET ultima_interaccion = NEW.created_at WHERE id = NEW.cliente_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_actualizar_ultima_interaccion ON interacciones;
CREATE TRIGGER trg_actualizar_ultima_interaccion AFTER INSERT ON interacciones FOR EACH ROW EXECUTE FUNCTION actualizar_ultima_interaccion();

CREATE OR REPLACE FUNCTION log_proyecto_completado_func() RETURNS TRIGGER AS $$ BEGIN IF NEW.estado = 'completado' AND OLD.estado IS DISTINCT FROM NEW.estado THEN INSERT INTO audit_logs (accion, modulo, detalle, usuario, created_at) VALUES ('Proyecto Completado','Proyectos',jsonb_build_object('id',NEW.id,'nombre',NEW.nombre,'cliente',NEW.cliente_nombre),'Sistema Automático',NOW()); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS log_proyecto_completado ON proyectos;
CREATE TRIGGER log_proyecto_completado AFTER UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION log_proyecto_completado_func();

CREATE OR REPLACE FUNCTION buscar_conocimiento (query_embedding vector(768), match_threshold float, match_count int) RETURNS TABLE (id int, titulo text, contenido text, categoria text, similarity float) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY SELECT ca.id, ca.titulo, ca.contenido, ca.categoria, 1 - (ca.embedding <=> query_embedding) AS similarity FROM conocimiento_agencia ca WHERE 1 - (ca.embedding <=> query_embedding) > match_threshold ORDER BY similarity DESC LIMIT match_count; END; $$;

INSERT INTO prompts_ai (slug, system_prompt, user_prompt_template) VALUES ('director_estrategico','Eres el Director Estratégico Senior de DESEO DIGITAL.','Redacta una propuesta persuasiva para {{clienteNombre}}. Servicios: {{servicios}}. Enfócate en el ROI y el anticipo del 50%.'), ('cfo_agencia','Eres el CFO de DESEO DIGITAL.','Analiza el flujo de caja. Anticipos recaudados: {{montoPagado}}. Presupuesto total: {{presupuesto}}.'), ('content_lead','Eres el Content Lead de DESEO DIGITAL.','Genera 4 ideas de Reels y 5 Stories para {{clienteNombre}}. Recuerda que Jessica López edita los Reels.') ON CONFLICT (slug) DO UPDATE SET system_prompt = EXCLUDED.system_prompt, user_prompt_template = EXCLUDED.user_prompt_template, version = prompts_ai.version + 1;

CREATE INDEX idx_clientes_estado ON clientes(estado);
CREATE INDEX idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado);
CREATE INDEX idx_oportunidades_cliente_id ON oportunidades(cliente_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_cliente_id ON proyectos(cliente_id);
CREATE INDEX idx_tareas_estado ON tareas(estado);
CREATE INDEX idx_tareas_proyecto_id ON tareas(proyecto_id);
CREATE INDEX idx_interacciones_cliente_id ON interacciones(cliente_id);
CREATE INDEX idx_conocimiento_embedding ON conocimiento_agencia USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_oportunidades_abiertas ON oportunidades(etapa) WHERE estado = 'Abierta';
CREATE INDEX idx_proyectos_activos ON proyectos(estado) WHERE estado IN ('planificacion','en_progreso','pausado');
CREATE INDEX idx_tareas_pendientes ON tareas(estado) WHERE estado = 'Pendiente';
CREATE INDEX idx_clientes_activos ON clientes(estado) WHERE estado = 'Activo';

CREATE VIEW vista_proyectos_cliente AS SELECT p.id, p.nombre, p.descripcion, p.cliente_id, p.cliente_nombre, p.servicios, p.oportunidad_id, p.estado, p.prioridad, p.fecha_inicio, p.fecha_fin, p.progreso, p.presupuesto, p.costo_actual, p.tareas, p.recursos, p.monto_pagado, p.onboarding_checklist, p.estado_pago, p.metodo_pago, p.fase_administrativa, p.plan_contenido, p.creado_en, p.actualizado_en, c.email AS cliente_email, c.telefono AS cliente_telefono, c.empresa AS cliente_empresa FROM proyectos p LEFT JOIN clientes c ON p.cliente_id = c.id;

CREATE VIEW vista_tareas_completas AS SELECT t.id, t.titulo, t.descripcion, t.fecha, t.prioridad, t.estado, t.created_at, t.proyecto_id, t.oportunidad_id, t.cliente_id, t.responsable_id, c.nombre AS cliente_nombre, s.nombre AS responsable_nombre FROM tareas t LEFT JOIN clientes c ON t.cliente_id = c.id LEFT JOIN subagentes s ON t.responsable_id = s.id;

CREATE VIEW vista_kpi_dashboard AS SELECT (SELECT COUNT(*) FROM clientes WHERE estado = 'Activo') AS clientes_activos, (SELECT COUNT(*) FROM proyectos WHERE estado IN ('planificacion','en_progreso','pausado') OR estado = 'planificacion') AS proyectos_activos, (SELECT COUNT(*) FROM tareas WHERE estado = 'Pendiente') AS tareas_pendientes, (SELECT COUNT(*) FROM oportunidades WHERE estado = 'Abierta') AS oportunidades_abiertas, (SELECT COALESCE(SUM(presupuesto),0) FROM proyectos) AS presupuesto_total;
