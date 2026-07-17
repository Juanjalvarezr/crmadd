-- ============================================================
-- Seed completo Juan José / DESEO DIGITAL (idempotente)
-- Ajustado al schema real de Supabase
-- ============================================================

-- 0. Limpiar datos previos de Juan José para reinsertar
DELETE FROM public.interacciones WHERE cliente_id = (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com');
DELETE FROM public.notificaciones WHERE TRUE;
DELETE FROM public.cuotas WHERE transaccion_id IN (
  SELECT id FROM public.transacciones WHERE cliente_id = (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
);
DELETE FROM public.transacciones WHERE cliente_id = (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com');
DELETE FROM public.contratos WHERE cliente_id = (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com');
DELETE FROM public.facturas WHERE proyecto_id = 'PROY-DESEO-001';
DELETE FROM public.oportunidades WHERE cliente_id = (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com');
DELETE FROM public.tareas WHERE cliente_id = (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com');
DELETE FROM public.proyectos WHERE codigo = 'PROY-DESEO-001';
DELETE FROM public.clientes WHERE email = 'juan@deseodigital.com';

-- 1. Cliente Juan José
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, estado, origen, ultima_interaccion)
VALUES (
  'Juan José',
  'juan@deseodigital.com',
  '3000000000',
  'DESEO DIGITAL',
  'Marketing Digital',
  'Activo',
  'Interno',
  CURRENT_DATE
);

-- 2. Proyecto integral (id text manual)
INSERT INTO public.proyectos (
  id, nombre, descripcion, cliente_id, cliente_nombre, estado, prioridad,
  fecha_inicio, fecha_fin, presupuesto, progreso, codigo, estado_pago, metodo_pago
)
VALUES (
  'PROY-DESEO-001',
  'Proyecto Integral DESEO DIGITAL',
  'Estrategia completa: branding, contenido, paid media, SEO, email marketing, automatizaciones y reporting.',
  (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'),
  'Juan José',
  'en_progreso',
  'Alta',
  '2026-07-01',
  '2026-12-31',
  50000000,
  35,
  'PROY-DESEO-001',
  'parcial',
  'transferencia'
);

-- 3. Tareas cronograma (con estado y progreso)
INSERT INTO public.tareas (
  titulo, descripcion, proyecto_id, cliente_id, estado, prioridad, fecha
)
VALUES
  ('Brief estratégico y discovery', 'Reunión kick-off, investigación, buyer persona, journey map.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Completada', 'Alta', '2026-07-01'),
  ('Estrategia de marketing', 'Definir objetivos, KPIs, canales y presupuesto mensual.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Completada', 'Alta', '2026-07-05'),
  ('Cronograma de contenido', 'Plan editorial mensual: temas, formatos, calendario y responsabilidades.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'En progreso', 'Alta', '2026-07-10'),
  ('Diseño de identidad visual', 'Logo, paleta, tipografía, piezas y templates.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'En progreso', 'Media', '2026-07-12'),
  ('Implementación CRM', 'Configuración, roles, automatizaciones, paneles.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Pendiente', 'Alta', '2026-07-18'),
  ('Campaña paid media', 'Meta Ads + Google Ads con píxeles y eventos.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Pendiente', 'Media', '2026-07-20'),
  ('Email marketing', 'Flujos, secuencias, listas, automatizaciones.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Pendiente', 'Baja', '2026-07-22'),
  ('SEO técnico y contenido', 'Auditoría, keywords, optimización on-page.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Pendiente', 'Media', '2026-07-25'),
  ('Reporting y optimización', 'Dashboards, métricas mensuales, ajustes.', 'PROY-DESEO-001', (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Pendiente', 'Baja', '2026-08-01');

-- 4. Contrato (id uuid manual)
INSERT INTO public.contratos (
  id, cliente_id, proyecto_id, tipo, titulo, contenido, numero, estado, fecha_inicio, fecha_fin, valor
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'),
  'PROY-DESEO-001',
  'prestacion_servicios',
  'Contrato Integral DESEO DIGITAL',
  'Objeto: prestación de servicios integrales de marketing digital. Incluye estrategia, contenido, paid media, SEO y reportes.',
  'CONT-2026-001',
  'activo',
  '2026-07-01',
  '2026-12-31',
  50000000
);

-- 5. Factura inicial (id bigint auto-incremental, no hay que asignarlo)
INSERT INTO public.facturas (proyecto_id, cliente_id, numero, tipo, subtotal, iva, total, moneda, estado, estado_pago, fecha_emision, fecha_vencimiento, concepto, notas)
VALUES (
  'PROY-DESEO-001',
  (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'),
  'FAC-2026-001',
  'servicio',
  50000000,
  0,
  50000000,
  'COP',
  'borrador',
  'parcial',
  '2026-07-15',
  '2026-08-15',
  'Factura FAC-2026-001 - Anticuesto y cuotas',
  'Pendiente de pago completo'
);

-- 5.1 Transacciones y cuotas
DO $$
DECLARE
  proy_id text := 'PROY-DESEO-001';
  cli_id bigint := (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com');
  inv_id uuid;
BEGIN
  INSERT INTO public.transacciones (cliente_id, proyecto_id, tipo, categoria, monto, forma_pago, descripcion, fecha)
  VALUES (cli_id, proy_id, 'ingreso', 'pago_cliente', 20000000, 'transferencia', 'Anticuesto factura FAC-2026-001', '2026-07-05')
  RETURNING id INTO inv_id;
  INSERT INTO public.cuotas (transaccion_id, monto, fecha_vencimiento, estado) VALUES (inv_id, 20000000, '2026-07-05', 'pagada');

  INSERT INTO public.transacciones (cliente_id, proyecto_id, tipo, categoria, monto, forma_pago, descripcion, fecha)
  VALUES (cli_id, proy_id, 'ingreso', 'pago_cliente', 5000000, 'transferencia', 'Segunda cuota FAC-2026-001', '2026-08-05')
  RETURNING id INTO inv_id;
  INSERT INTO public.cuotas (transaccion_id, monto, fecha_vencimiento, estado) VALUES (inv_id, 5000000, '2026-08-05', 'pendiente');

  INSERT INTO public.transacciones (cliente_id, proyecto_id, tipo, categoria, monto, forma_pago, descripcion, fecha)
  VALUES (cli_id, proy_id, 'ingreso', 'pago_cliente', 25000000, 'transferencia', 'Tercera cuota FAC-2026-001', '2026-09-05')
  RETURNING id INTO inv_id;
  INSERT INTO public.cuotas (transaccion_id, monto, fecha_vencimiento, estado) VALUES (inv_id, 25000000, '2026-09-05', 'pendiente');
END $$;

-- 6. Oportunidades
INSERT INTO public.oportunidades (cliente_id, nombre, valor, servicios_interes, fecha_cierre_esperada, etapa, probabilidad, estado)
VALUES
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Renovación anual', 60000000, ARRAY['Estrategia','Contenido mensual'], '2026-11-30', 'negociacion', 70, 'abierta'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'Upsell: producción video', 12000000, ARRAY['Video'], '2026-09-15', 'propuesta', 40, 'abierta');

-- 7. Servicios / paquetes
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado)
VALUES
  ('Estrategia', 'consultoria', 'Estrategia digital integral.', 8000000, '1 mes', ARRAY[' briefing','KPIs','plan de acción'], 'activo'),
  ('Contenido mensual', 'recurrente', 'Producción de contenido mensual.', 5000000, '1 mes', ARRAY[' copywriting','diseño','calendario'], 'activo'),
  ('Paquete Básico', 'paquete', 'Estrategia + contenido básico.', 12000000, '3 meses', ARRAY[' estrategia','8 piezas','reporte'], 'activo'),
  ('Paquete Premium', 'paquete', 'Estrategia + contenido + paid media.', 25000000, '6 meses', ARRAY[' estrategia','16 piezas','ads','reporte'], 'activo');

-- 8. Agenda via interacciones (reemplazo de eventos_calendario)
INSERT INTO public.interacciones (cliente_id, tipo, asunto, contenido, usuario)
VALUES
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'reunion', 'Kick-off DESEO DIGITAL', 'Brief estratégico y discovery con cliente.', 'CRM'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'reunion', 'Presentación estrategia', 'Presentación de estrategia de marketing y KPIs.', 'CRM'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'reunion', 'Review identidad visual', 'Validación de logo, paleta y piezas gráficas.', 'CRM'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'checkpoint', 'Cierre primera quincena', 'Review de avance: contenido, paid media y CRM.', 'CRM'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'tarea', 'Optimización SEO', 'Auditoría SEO, keywords, optimización on-page y reportes.', 'CRM'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'checkpoint', 'Review Q3', 'Cierre trimestral, pagos y planificación Q4.', 'CRM'),
  ((SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'), 'reunion', 'Renovación contrato', 'Negociación renovación anual y upsell servicios.', 'CRM');

-- 9. Notificaciones seed
INSERT INTO public.notificaciones (tipo, titulo, mensaje, leida)
VALUES
  ('warning', 'Cuota pendiente', 'FAC-2026-001: segunda cuota vence el 2026-08-05 por $5.000.000', false),
  ('warning', 'Tarea pendiente', 'Revisar cronograma de contenido antes del 2026-07-15', false),
  ('info', 'Checkpoint', 'Cierre primera quincena programado para 2026-07-31', false);
