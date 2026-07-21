INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, created_at)
VALUES
  ('Diseñar identidad visual', 'Logo, paleta, tipografía y manual de marca', '2026-07-20', 'Alta', 'Pendiente', 'Diseño', 'PRY-2', 41, NOW()),
  ('Configurar CRM', 'Setup de módulos, roles y permisos', '2026-07-18', 'Alta', 'En progreso', 'Tecnología', 'PRY-2', 41, NOW()),
  ('Redactar copy de campaña', 'Texto para redes y email marketing', '2026-07-22', 'Media', 'Pendiente', 'Contenido', 'PRY-2', 41, NOW()),
  ('Reunión kick-off', 'Presentación del equipo y alcance', '2026-07-17', 'Alta', 'Completada', 'Reunión', 'PRY-2', 41, NOW()),
  ('Implementar chatbot WhatsApp', 'Flujo de atención automática', '2026-07-25', 'Media', 'Pendiente', 'Desarrollo', 'PRY-2', 41, NOW());

INSERT INTO public.facturas (proyecto_id, cliente_id, numero, concepto, monto, subtotal, iva, total, estado_pago, estado, tipo, moneda, fecha_emision, fecha_vencimiento, created_at)
VALUES
  ('PRY-2', 41, 'FAC-001', 'Diseño identity + setup CRM', 2500000, 2092437, 407563, 2500000, 'pendiente', 'emitida', 'cuota', 'COP', '2026-07-15', '2026-08-15', NOW()),
  ('PRY-2', 41, 'FAC-002', 'Campaña redes + copy', 1800000, 1512605, 287395, 1800000, 'parcial', 'emitida', 'cuota', 'COP', '2026-07-20', '2026-08-20', NOW()),
  ('PRY-2', 41, 'FAC-003', 'Chatbot WhatsApp', 1200000, 1008420, 191580, 1200000, 'pagada', 'pagada', 'cuota', 'COP', '2026-07-10', '2026-08-10', NOW());

INSERT INTO public.contratos (proyecto_id, cliente_id, tipo, titulo, contenido, numero, estado, fecha_inicio, fecha_fin, valor, created_at)
VALUES
  ('PRY-2', 41, 'prestacion_servicios', 'Contrato Diseño + CRM', 'Objeto: diseño de identidad visual, implementación de CRM, setup inicial.', 'CTR-001', 'firmado', '2026-07-15', '2026-10-15', 5500000, NOW()),
  ('PRY-2', 41, 'acuerdo_confidencialidad', 'NDA Agencia-Cliente', 'Compromiso de confidencialidad de información sensible.', 'CTA-001', 'firmado', '2026-07-15', '2027-07-15', 0, NOW());

INSERT INTO public.documentos (entidad_tipo, entidad_id, titulo, url, tipo, creado_en, usuario)
VALUES
  ('proyecto', 'PRY-2', 'Brief del proyecto', 'https://example.com/brief-pry2.pdf', 'pdf', NOW(), 'admin'),
  ('proyecto', 'PRY-2', 'Contrato firmado', 'https://example.com/contrato-pry2.pdf', 'pdf', NOW(), 'admin'),
  ('proyecto', 'PRY-2', ' Factura FAC-001', 'https://example.com/fac001-pry2.pdf', 'pdf', NOW(), 'admin');

UPDATE public.proyectos
SET
  estrategia = '{"objetivo":"Lanzar identidad y CRM operativo","publico_objetivo":"emprendedores","diferenciador":"IA integrada","cronograma":"Kick-off → Diseño → Desarrollo → Entrega"}',
  canales = '{"redes":true,"ads":false,"email":true,"seo":true}',
  facturacion_detalle = '{"cuotas":[{"id":"1","monto":2500000,"estado":"pendiente","fecha":"2026-08-15"},{"id":"2","monto":1800000,"estado":"parcial","fecha":"2026-08-20"},{"id":"3","monto":1200000,"estado":"pagada","fecha":"2026-08-10"}],"monto_total":5500000,"monto_pagado":1200000,"estado":"en_proceso"}',
  cronograma = '[{"titulo":"Kick-off","completado":true,"fecha":"2026-07-15"},{"titulo":"Diseño identity","completado":false,"fecha":"2026-07-20"},{"titulo":"Setup CRM","completado":false,"fecha":"2026-07-22"},{"titulo":"Campaña lanzamiento","completado":false,"fecha":"2026-08-01"}]',
  actualizado_en = NOW()
WHERE id = 'PRY-2';
