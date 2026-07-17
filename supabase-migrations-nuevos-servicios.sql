-- Migraciones para nuevos servicios del CRM DESEO DIGITAL
-- Ejecutar estas migraciones en el SQL Editor de Supabase

-- ============================================
-- TABLAS PARA EMAIL SEQUENCES
-- ============================================

-- Tabla de secuencias de email
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('bienvenida', 'nutricion', 'recuperacion', 'venta', 'custom')),
  activo BOOLEAN DEFAULT true,
  trigger_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pasos de secuencia de email
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  asunto TEXT NOT NULL,
  contenido TEXT NOT NULL,
  delay_dias INTEGER DEFAULT 0,
  delay_horas INTEGER DEFAULT 0,
  plantilla_id TEXT,
  variables JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  UNIQUE(sequence_id, orden)
);

-- Tabla de ejecuciones de secuencia
CREATE TABLE IF NOT EXISTS email_sequence_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  cliente_id INTEGER,
  paso_actual INTEGER DEFAULT 1,
  estado TEXT NOT NULL CHECK (estado IN ('en_progreso', 'completada', 'pausada', 'cancelada')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  emails_enviados JSONB DEFAULT '[]'
);

-- Tabla de emails enviados
CREATE TABLE IF NOT EXISTS email_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID REFERENCES email_sequence_executions(id) ON DELETE CASCADE,
  step_id UUID REFERENCES email_sequence_steps(id) ON DELETE CASCADE,
  cliente_id INTEGER,
  asunto TEXT NOT NULL,
  contenido TEXT NOT NULL,
  enviado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  abierto_at TIMESTAMP WITH TIME ZONE,
  clickeado_at TIMESTAMP WITH TIME ZONE,
  respondido_at TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL CHECK (estado IN ('enviado', 'abierto', 'clickeado', 'respondido', 'rebotado')),
  error TEXT
);

-- ============================================
-- TABLAS PARA WHATSAPP BUSINESS
-- ============================================

-- Tabla de plantillas de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  categoria TEXT NOT NULL CHECK (categoria IN ('marketing', 'utility', 'authentication')),
  contenido TEXT NOT NULL,
  variables TEXT[],
  estado TEXT NOT NULL CHECK (estado IN ('aprobado', 'pendiente', 'rechazado')),
  language_code TEXT DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id INTEGER,
  telefono TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('template', 'texto', 'media')),
  contenido TEXT NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id),
  variables JSONB DEFAULT '{}',
  media_url TEXT,
  media_tipo TEXT CHECK (media_tipo IN ('imagen', 'video', 'documento', 'audio')),
  estado TEXT NOT NULL CHECK (estado IN ('enviado', 'entregado', 'leido', 'fallido')),
  whatsapp_message_id TEXT,
  enviado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entregado_at TIMESTAMP WITH TIME ZONE,
  leido_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

-- Tabla de respuestas automáticas de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_autorespuestas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  palabra_clave TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLAS PARA WORKFLOW AUTOMATION
-- ============================================

-- Tabla de reglas de workflow
CREATE TABLE IF NOT EXISTS workflow_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  trigger_config JSONB NOT NULL,
  condiciones JSONB NOT NULL,
  acciones JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ejecuciones de workflow
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES workflow_rules(id) ON DELETE CASCADE,
  entidad_tipo TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('ejecutado', 'fallido', 'pendiente')),
  resultado JSONB DEFAULT '{}',
  error TEXT,
  ejecutado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLAS PARA DASHBOARD PERSONALIZABLE
-- ============================================

-- Tabla de layouts de dashboard
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  usuario_id TEXT DEFAULT 'default',
  rol TEXT,
  widgets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLAS PARA INTEGRACIONES
-- ============================================

-- Tabla de integraciones
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('google_calendar', 'google_sheets', 'slack', 'zapier', 'hubspot', 'custom')),
  activo BOOLEAN DEFAULT false,
  configuracion JSONB NOT NULL DEFAULT '{}',
  webhooks TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos de integración
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  datos JSONB NOT NULL DEFAULT '{}',
  estado TEXT NOT NULL CHECK (estado IN ('procesado', 'pendiente', 'fallido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  procesado_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

-- ============================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

-- Índices para email sequences
CREATE INDEX IF NOT EXISTS idx_email_sequences_executions_cliente ON email_sequence_executions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_executions_estado ON email_sequence_executions(estado);
CREATE INDEX IF NOT EXISTS idx_email_sent_execution ON email_sent(execution_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_cliente ON email_sent(cliente_id);

-- Índices para WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_cliente ON whatsapp_messages(cliente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_estado ON whatsapp_messages(estado);
CREATE INDEX IF NOT EXISTS idx_whatsapp_autorespuestas_palabra ON whatsapp_autorespuestas(palabra_clave);

-- Índices para workflows
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule ON workflow_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_entidad ON workflow_executions(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_estado ON workflow_executions(estado);

-- Índices para dashboard
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_usuario ON dashboard_layouts(usuario_id);

-- Índices para integraciones
CREATE INDEX IF NOT EXISTS idx_integration_events_integration ON integration_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_estado ON integration_events(estado);

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_autorespuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según roles reales)
-- Por ahora, permitir acceso público para desarrollo
-- TODO: Ajustar políticas según roles de usuario (admin, vendedor, soporte)

CREATE POLICY "Permitir lectura pública" ON email_sequences FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON email_sequences FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON email_sequences FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON email_sequences FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON email_sequence_steps FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON email_sequence_steps FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON email_sequence_steps FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON email_sequence_steps FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON email_sequence_executions FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON email_sequence_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON email_sequence_executions FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON email_sequence_executions FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON email_sent FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON email_sent FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON email_sent FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON email_sent FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON whatsapp_templates FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON whatsapp_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON whatsapp_templates FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON whatsapp_templates FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON whatsapp_messages FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON whatsapp_messages FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON whatsapp_autorespuestas FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON whatsapp_autorespuestas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON whatsapp_autorespuestas FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON whatsapp_autorespuestas FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON workflow_rules FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON workflow_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON workflow_rules FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON workflow_rules FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON workflow_executions FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON workflow_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON workflow_executions FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON workflow_executions FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON dashboard_layouts FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON dashboard_layouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON dashboard_layouts FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON dashboard_layouts FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON integrations FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON integrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON integrations FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON integrations FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública" ON integration_events FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON integration_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública" ON integration_events FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública" ON integration_events FOR DELETE USING (true);

-- ============================================
-- FUNCIONES PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_rules_updated_at BEFORE UPDATE ON workflow_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE email_sequences IS 'Secuencias de email automatizadas para nutrición de leads';
COMMENT ON TABLE email_sequence_steps IS 'Pasos individuales de una secuencia de email';
COMMENT ON TABLE email_sequence_executions IS 'Ejecuciones activas de secuencias por cliente';
COMMENT ON TABLE email_sent IS 'Registro de emails enviados con tracking';
COMMENT ON TABLE whatsapp_templates IS 'Plantillas de mensajes predefinidos para WhatsApp';
COMMENT ON TABLE whatsapp_messages IS 'Historial de mensajes de WhatsApp enviados/recibidos';
COMMENT ON TABLE whatsapp_autorespuestas IS 'Respuestas automáticas basadas en palabras clave';
COMMENT ON TABLE workflow_rules IS 'Reglas de automatización de workflows';
COMMENT ON TABLE workflow_executions IS 'Historial de ejecuciones de workflows';
COMMENT ON TABLE dashboard_layouts IS 'Configuraciones personalizadas de dashboard por usuario';
COMMENT ON TABLE integrations IS 'Configuración de integraciones con servicios externos';
COMMENT ON TABLE integration_events IS 'Registro de eventos de integraciones para auditoría';
