-- 10 MEJORAS PARA TABLA TAREAS
-- Ejecutar en Supabase SQL Editor

-- 1. Subtareas
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS subtareas JSONB DEFAULT '[]'::jsonb;
-- 2. Dependencias entre tareas
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS dependencias INTEGER[] DEFAULT '{}';
-- 3. Adjuntos
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;
-- 4. Comentarios con menciones
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb;
-- 5. Recordatorios WhatsApp/Email
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS recordatorios JSONB DEFAULT '[]'::jsonb;
-- 6. Timer inicio
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS tiempo_inicio TIMESTAMP WITH TIME ZONE;
-- 7. Timer pausa
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS tiempo_pausa TIMESTAMP WITH TIME ZONE;
-- 8. Timer fin
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS tiempo_fin TIMESTAMP WITH TIME ZONE;
-- 9. Tiempo total (segundos)
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS tiempo_total INTEGER DEFAULT 0;
-- 10. Timer activo
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS timer_activo BOOLEAN DEFAULT FALSE;

-- 11. Cierre automático al pagar factura/proyecto vinculado
CREATE OR REPLACE FUNCTION cerrar_tareas_por_pago_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado_pago = 'pagado' AND OLD.estado_pago <> 'pagado' THEN
    UPDATE tareas
    SET estado = 'Completada'
    WHERE proyecto_id = NEW.id
      AND estado NOT IN ('Completada');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cerrar_tareas_por_pago_proyecto ON proyectos;
CREATE TRIGGER trg_cerrar_tareas_por_pago_proyecto
  AFTER UPDATE OF estado_pago ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION cerrar_tareas_por_pago_proyecto();
