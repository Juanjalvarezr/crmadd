
-- Migración segura: extiende la tabla equipo con columnas nuevas
-- Compatible con filas y código existente (nunca ALTER/DROP)
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS herramientas TEXT[] DEFAULT '{}';
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS capacidad_max_proyectos INTEGER DEFAULT 3;
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS proyectos_activos INTEGER DEFAULT 0;
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS agent_prompt_slug TEXT DEFAULT NULL;
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS modo_operativo TEXT DEFAULT 'activo' CHECK (modo_operativo IN ('activo','solo_lectura','vacaciones','inactivo'));
ALTER TABLE equipo ADD COLUMN IF NOT EXISTS configuracion JSONB DEFAULT '{}'::jsonb;

-- Permisos granulares por módulo del CRM
CREATE TABLE IF NOT EXISTS agente_permisos (
  id BIGSERIAL PRIMARY KEY,
  agente_id INTEGER REFERENCES equipo(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  acciones TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agente_id, modulo)
);

-- Auditoría de actividad por agente
CREATE TABLE IF NOT EXISTS agente_actividad (
  id BIGSERIAL PRIMARY KEY,
  agente_id INTEGER REFERENCES equipo(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,
  entidad_tipo TEXT,
  entidad_id INTEGER,
  detalle JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agente_actividad_agente_id ON agente_actividad(agente_id);
CREATE INDEX IF NOT EXISTS idx_agente_permisos_agente_id ON agente_permisos(agente_id);

COMMENT ON TABLE agente_permisos IS 'Permisos granulares por módulo: clientes, proyectos, tareas, ventas, configuracion, etc.';
COMMENT ON TABLE agente_actividad IS 'Auditoría de acciones realizadas por cada agente para trazabilidad y métricas.';
