
CREATE MATERIALIZED VIEW mv_agente_carga AS
SELECT
  e.id AS agente_id,
  e.nombre AS agente_nombre,
  e.rol,
  e.modo_operativo,
  e.capacidad_max_proyectos,
  e.proyectos_activos,
  COUNT(t.id) FILTER (WHERE t.estado = 'Pendiente') AS tareas_pendientes,
  COUNT(DISTINCT t.proyecto_id) FILTER (WHERE t.estado = 'Pendiente') AS proyectos_con_pendientes,
  MAX(t.fecha) FILTER (WHERE t.estado = 'Pendiente') AS proxima_fecha_pendiente,
  now() AS actualizado_en
FROM equipo e
LEFT JOIN tareas t ON t.responsable_id = e.id
GROUP BY e.id;

CREATE INDEX IF NOT EXISTS idx_mv_agente_carga_agente_id ON mv_agente_carga (agente_id);
CREATE INDEX IF NOT EXISTS idx_mv_agente_carga_modo ON mv_agente_carga (modo_operativo);

COMMENT ON MATERIALIZED VIEW mv_agente_carga IS 'Carga operativa por agente para asignaciones, alertas y reglas de capacidad.';
