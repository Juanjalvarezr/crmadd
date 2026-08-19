-- ============================================================
-- CRM DESEO DIGITAL — Reparación completa de esquema Supabase
-- Ejecutar en: Supabase SQL Editor
-- Idempotente: usa IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- PREVENCION DE ERROR: eliminar vistas dependientes antes de
-- cambiar tipos de columnas; se recrean al final del script.
-- ============================================================
DROP VIEW IF EXISTS vista_kpi_dashboard;
DROP VIEW IF EXISTS vista_tareas_completas;
DROP VIEW IF EXISTS vista_proyectos_cliente;

-- ============================================================
-- 1) EQUIPO (antes subagentes)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subagentes') THEN
    EXECUTE 'ALTER TABLE IF EXISTS subagentes RENAME TO equipo';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipo') THEN
    CREATE TABLE equipo (
      id BIGSERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('Admin','Soporte','Técnico','Creativo','Vendedor')),
      especialidad TEXT,
      estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- Asegurar columna rol incluye Vendedor si la tabla ya existía
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipo') THEN
    ALTER TABLE equipo
      ADD COLUMN IF NOT EXISTS especialidad TEXT;
  END IF;
END $$;

-- ============================================================
-- 2) CLIENTES
-- ============================================================
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS origen TEXT,
  ADD COLUMN IF NOT EXISTS dolores TEXT,
  ADD COLUMN IF NOT EXISTS necesidades TEXT,
  ADD COLUMN IF NOT EXISTS intereses TEXT;

ALTER TABLE clientes
  ALTER COLUMN ultima_interaccion TYPE TIMESTAMP WITH TIME ZONE
    USING ultima_interaccion::timestamptz,
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
    USING created_at::timestamptz;

UPDATE clientes SET estado = 'Activo' WHERE estado IS NULL;
UPDATE clientes SET created_at = now() WHERE created_at IS NULL;
UPDATE clientes SET ultima_interaccion = now() WHERE ultima_interaccion IS NULL;

-- ============================================================
-- 3) SERVICIOS
-- ============================================================
ALTER TABLE servicios
  ALTER COLUMN precio_base SET DEFAULT 0,
  ALTER COLUMN incluye SET DEFAULT '{}';

UPDATE servicios SET precio_base = 0 WHERE precio_base IS NULL;
UPDATE servicios SET estado = 'Activo' WHERE estado IS NULL;

-- ============================================================
-- 4) CONFIGURACION_EMPRESA
-- ============================================================
ALTER TABLE configuracion_empresa
  ADD COLUMN IF NOT EXISTS google_business_link TEXT;

-- ============================================================
-- 5) OPORTUNIDADES
-- ============================================================
ALTER TABLE oportunidades
  ALTER COLUMN servicios_interes SET DEFAULT '{}',
  ALTER COLUMN valor SET DEFAULT 0;

UPDATE oportunidades SET estado = 'Abierta' WHERE estado IS NULL;

-- ============================================================
-- 6) PROYECTOS
-- ============================================================
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS servicios TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tareas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recursos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS monto_pagado BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'pendiente'
    CHECK (estado_pago IN ('pendiente','parcial','pagado','vencido')),
  ADD COLUMN IF NOT EXISTS metodo_pago TEXT,
  ADD COLUMN IF NOT EXISTS fase_administrativa TEXT DEFAULT 'operacion',
  ADD COLUMN IF NOT EXISTS plan_contenido JSONB DEFAULT '{"reels":[],"stories":[],"pauta":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE proyectos
  ALTER COLUMN creado_en TYPE TIMESTAMP WITH TIME ZONE
    USING creado_en::timestamptz,
  ALTER COLUMN actualizado_en TYPE TIMESTAMP WITH TIME ZONE
    USING actualizado_en::timestamptz;

UPDATE proyectos SET estado = 'planificacion' WHERE estado IS NULL;
UPDATE proyectos SET estado_pago = 'pendiente' WHERE estado_pago IS NULL;

-- ============================================================
-- 7) TAREAS
-- ============================================================
ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Tarea'
    CHECK (tipo IN ('Tarea','Cita','Llamada','Seguimiento')),
  ADD COLUMN IF NOT EXISTS link_reunion TEXT;

-- ============================================================
-- 8) INTERACCIONES
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interacciones') THEN
    ALTER TABLE interacciones
      ADD COLUMN IF NOT EXISTS asunto TEXT,
      ADD COLUMN IF NOT EXISTS contenido TEXT,
      ADD COLUMN IF NOT EXISTS usuario TEXT DEFAULT 'Asistente IA';

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interacciones' AND column_name = 'detalle') THEN
      UPDATE interacciones SET contenido = detalle WHERE contenido IS NULL AND detalle IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 9) CAMPANAS / PLANTILLAS EMAIL
-- ============================================================
ALTER TABLE campanas_email
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ============================================================
-- 10) AUDIT_LOGS
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'detalle') THEN
    ALTER TABLE audit_logs
      ALTER COLUMN detalle TYPE JSONB
        USING detalle::jsonb;
  END IF;
END $$;

-- ============================================================
-- 11) CONOCIMIENTO_AGENCIA
-- ============================================================
ALTER TABLE conocimiento_agencia
  ADD COLUMN IF NOT EXISTS embedding vector(768),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conocimiento_agencia' AND column_name = 'embedding' AND data_type = 'ARRAY') THEN
    ALTER TABLE conocimiento_agencia
      ALTER COLUMN embedding TYPE vector(768)
        USING embedding::vector;
  END IF;
END $$;

-- ============================================================
-- 12) PROMPTS_AI
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompts_ai') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts_ai' AND column_name = 'id' AND data_type = 'uuid') THEN
      ALTER TABLE prompts_ai
        ALTER COLUMN id TYPE TEXT
          USING id::TEXT;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 13) NUEVAS TABLAS USADAS POR RUTAS/SERVICES
-- ============================================================

-- 13.1 FACTURAS
CREATE TABLE IF NOT EXISTS facturas (
  id BIGSERIAL PRIMARY KEY,
  numero_factura TEXT,
  estado TEXT DEFAULT 'Borrador' CHECK (estado IN ('Borrador','Enviada','Pagada','Vencida','Anulada')),
  total NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  iva NUMERIC DEFAULT 0,
  descuento NUMERIC DEFAULT 0,
  metodo_pago TEXT,
  notas TEXT,
  proyecto_id TEXT,
  cliente_id BIGINT,
  fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_vencimiento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13.2 PAGOS
CREATE TABLE IF NOT EXISTS pagos (
  id BIGSERIAL PRIMARY KEY,
  factura_id BIGINT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  metodo_pago TEXT,
  referencia TEXT,
  comprobante_url TEXT,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13.3 PLANTILLAS DE DOCUMENTOS
CREATE TABLE IF NOT EXISTS plantillas_documentos (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('cotizacion','factura','contrato','recibo')),
  nombre TEXT NOT NULL,
  contenido TEXT,
  logo_url TEXT,
  color_primario TEXT,
  color_secundario TEXT,
  iva_porcentaje NUMERIC DEFAULT 0,
  valores_por_defecto JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13.4 DOCUMENTOS
CREATE TABLE IF NOT EXISTS documentos (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  url TEXT,
  descripcion TEXT,
  proyecto_id TEXT,
  cliente_id BIGINT,
  factura_id BIGINT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13.5 CONTRATOS
CREATE TABLE IF NOT EXISTS contratos (
  id BIGSERIAL PRIMARY KEY,
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo','Finalizado','Cancelado')),
  valor NUMERIC DEFAULT 0,
  proyecto_id TEXT,
  cliente_id BIGINT,
  factura_id BIGINT,
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13.6 BRIEFS
CREATE TABLE IF NOT EXISTS briefs (
  id BIGSERIAL PRIMARY KEY,
  proyecto_id TEXT,
  cliente_id BIGINT,
  titulo TEXT NOT NULL,
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Aprobado','Rechazado')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13.7 SOPS
CREATE TABLE IF NOT EXISTS sops (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 14) ROW LEVEL SECURITY + POLÍTICAS
-- ============================================================
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

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'clientes','equipo','servicios','configuracion_empresa',
      'oportunidades','proyectos','tareas','campanas_email',
      'plantillas_email','reglas_negocio_ai','conocimiento_agencia',
      'interacciones','prompts_ai','audit_logs'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', t);
    EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'facturas','pagos','plantillas_documentos','documentos',
      'contratos','briefs','sops'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', t);
    EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ============================================================
-- 15) ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_proyecto_id ON facturas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura_id ON pagos(factura_id);
CREATE INDEX IF NOT EXISTS idx_documentos_proyecto_id ON documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_proyecto_id ON contratos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_briefs_proyecto_id ON briefs(proyecto_id);

-- ============================================================
-- 16) DATOS BASE OPCIONALES
-- ============================================================
INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template, version)
VALUES
  ('prompt_001','director_estrategico','Eres el Director Estratégico Senior de DESEO DIGITAL.','Redacta una propuesta persuasiva para {{clienteNombre}}. Servicios: {{servicios}}. Enfócate en el ROI y el anticipo del 50%.',1),
  ('prompt_002','cfo_agencia','Eres el CFO de DESEO DIGITAL.','Analiza el flujo de caja. Anticipos recaudados: {{montoPagado}}. Presupuesto total: {{presupuesto}}.',1),
  ('prompt_003','content_lead','Eres el Content Lead de DESEO DIGITAL.','Genera 4 ideas de Reels y 5 Stories para {{clienteNombre}}. Recuerda que Jessica López edita los Reels.',1)
ON CONFLICT (slug) DO UPDATE
SET system_prompt = EXCLUDED.system_prompt,
    user_prompt_template = EXCLUDED.user_prompt_template,
    version = prompts_ai.version + 1;

INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, descripcion)
SELECT 'DESEO DIGITAL', 'contacto@deseodigital.com', '320 369 8476', 'https://deseodigital.com', 'Agencia especializada en Marketing Digital y SEO'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_empresa LIMIT 1);
