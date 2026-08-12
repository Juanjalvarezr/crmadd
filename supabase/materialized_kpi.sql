
CREATE MATERIALIZED VIEW mv_kpi_detalle AS
SELECT
  (SELECT COUNT(*) FROM clientes WHERE estado = 'Activo') AS clientes_activos,
  (SELECT COUNT(*) FROM proyectos WHERE estado IN ('planificacion','en_progreso','pausado')) AS proyectos_activos,
  (SELECT COUNT(*) FROM tareas WHERE estado = 'Pendiente') AS tareas_pendientes,
  (SELECT COUNT(*) FROM oportunidades WHERE estado = 'Abierta') AS oportunidades_abiertas,
  (SELECT COUNT(*) FROM proyectos WHERE estadoPago = 'vencido') AS proyectos_vencidos,
  (SELECT COALESCE(SUM(presupuesto),0) FROM proyectos) AS presupuesto_total,
  (SELECT COALESCE(SUM(monto_pagado),0) FROM proyectos) AS anticipo_recaudado,
  (SELECT COALESCE(SUM(presupuesto - monto_pagado),0) FROM proyectos) AS saldo_pendiente,
  now() AS actualizado_en;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_detalle_unico ON mv_kpi_detalle (actualizado_en);

COMMENT ON MATERIALIZED VIEW mv_kpi_detalle IS 'KPIs financieros y operativos agregados para dashboard rápido sin joins repetidos.';
