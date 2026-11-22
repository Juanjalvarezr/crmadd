-- Fusionar cliente 62 en 63 preservando todo el historial.
-- session_replication_role=replica desactiva triggers de updated_at que fallan en tablas sin esa columna.
SET session_replication_role = replica;

UPDATE public.proyectos SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.oportunidades SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.facturas SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.tareas SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.documentos SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.interacciones SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.cotizaciones SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.contratos SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.briefs SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.seguimientos SET cliente_id = 63 WHERE cliente_id = 62;
UPDATE public.enlaces_documentos SET cliente_id = 63 WHERE cliente_id = 62;

DELETE FROM public.clientes WHERE id = 62;

SET session_replication_role = origin;
