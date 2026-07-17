-- CLIENTE PRINCIPAL (idempotente)
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado, created_at)
VALUES (
  'juan José',
  'juan@deseodigital.com',
  '300 123 4567',
  'Deseo Digital',
  'Agencia de Marketing Digital',
  'Lead',
  'activo',
  now()
)
ON CONFLICT (email) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  empresa = EXCLUDED.empresa,
  nicho = EXCLUDED.nicho,
  origen = EXCLUDED.origen,
  estado = EXCLUDED.estado;

-- PROYECTOS DE JUAN JOSÉ (vinculados al cliente por email)
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.proyectos (cliente_id, nombre, descripcion, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, created_at)
SELECT cli.id, 'Smart Data', 'Plataforma de inteligencia comercial con dashboards y reporting automático para decisiones de negocio.', 'en_progreso', 'Operación', 35, 4500000, '2026-06-01', '2026-12-15', 'alta', now() FROM cli
UNION ALL
SELECT cli.id, 'Lo Que Deseo', 'Ecosistema digital: web, funnel y crecimiento de audiencia para marca personal.', 'en_progreso', 'Onboarding', 20, 3200000, '2026-07-01', '2026-11-30', 'alta', now() FROM cli
UNION ALL
SELECT cli.id, 'Escala Digital', 'Modelo de captación y WhatsApp Business para escalar ventas.', 'propuesta', 'Propuesta', 5, 1800000, '2026-08-01', '2026-10-30', 'media', now() FROM cli
ON CONFLICT DO NOTHING;

-- TAREAS SEMILLA
WITH proys AS (
  SELECT p.id
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_a, created_at)
SELECT proys.id, titulo, descripcion, estado, prioridad, fecha_ven, 'Juan José', now()
FROM proys
CROSS JOIN (VALUES
  ('Onboarding cliente y acceso CRM', 'Crear usuario, permisos iniciales y carga de brief.', 'pendiente', 'alta', CURRENT_DATE + 2),
  ('Brief inicial Smart Data', 'Definir KPIs, fuentes de datos y access tokens.', 'pendiente', 'alta', CURRENT_DATE + 4),
  ('Wireframes Lo Que Deseo', 'Validar pantallas clave con Juan antes de diseño.', 'pendiente', 'media', CURRENT_DATE + 6),
  ('Script de cierre WhatsApp', 'Redactar flujo de conversación y validación de interesados.', 'pendiente', 'media', CURRENT_DATE + 7),
  ('Mapa de contenidos Escala Digital', 'Definir pilares, formatos y frecuencia por canal.', 'pendiente', 'baja', CURRENT_DATE + 10),
  ('Configurar Registro DNS y Vercel', 'Deploy inicial y configuración de dominio.', 'pendiente', 'alta', CURRENT_DATE + 3),
  ('Integrar Resend en staging', 'Prueba real de envío y plantillas.', 'pendiente', 'media', CURRENT_DATE + 5)
) AS x(titulo, descripcion, estado, prioridad, fecha_ven)
ON CONFLICT DO NOTHING;

-- SERVICIOS POR PAQUETE
INSERT INTO public.servicios (nombre, categoria, precio_base, descripcion, activo, created_at)
VALUES
  ('Pack Elite', 'Paquete', 2000000, '4 Reels/mes, 5 Historias/día, gestión de campañas.', true, now()),
  ('Landing + Funnel', 'Paquete', 1800000, 'Diseño web, copy de conversión y automatización básica.', true, now()),
  ('Branding Express', 'Individual', 650000, 'Logo, paleta, manual básico y piezas iniciales.', true, now()),
  ('Campaña Ads', 'Individual', 900000, 'Creativos, métricas y optimización semanal.', true, now()),
  ('Social Media 1 mes', 'Individual', 750000, 'Calendario, 12 piezas e informe mensual.', true, now()),
  ('Consultoría Estratégica', 'Individual', 500000, 'Sesión de 2h con plan accionable.', true, now()),
  ('Automatización n8n', 'Individual', 850000, 'Workflow inicial, documentación y entrenamiento básico.', true, now())
ON CONFLICT DO NOTHING;

-- OPORTUNIDADES SEMILLA (sin columna origen)
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.oportunidades (cliente_id, nombre, etapa, valor, probabilidad, created_at)
SELECT cli.id, 'Upsell Escala Digital -> automatización', 'Propuesta', 850000, 40, now() FROM cli
UNION ALL
SELECT cli.id, 'Renovación Smart Data Q4', 'Negociación', 1200000, 60, now() FROM cli
ON CONFLICT DO NOTHING;

-- INTERACCIONES INICIALES
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.interacciones (cliente_id, tipo, descripcion, canal, fecha, usuario_id, created_at)
SELECT cli.id, tipo, descripcion, canal, fecha, '00000000-0000-0000-0000-000000000000', now()
FROM cli
CROSS JOIN (VALUES
  ('llamada', 'Llamada de discovery: objetivos y presupuesto.', 'WhatsApp', CURRENT_DATE - 5),
  ('correo', 'Envío de propuesta Pack Elite.', 'Email', CURRENT_DATE - 3),
  ('reunion', 'Reunión kick-off Lo Que Deseo.', 'Zoom', CURRENT_DATE - 1),
  ('nota', 'Interesado en automatizar cobros.', 'CRM', CURRENT_DATE)
) AS x(tipo, descripcion, canal, fecha)
ON CONFLICT DO NOTHING;

-- CONTRATO SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.contratos (cliente_id, proyecto_id, tipo, estado, monto, fecha_inicio, fecha_fin, created_at)
SELECT cli.id, proys.id, 'prestacion_servicios', 'activo', 2000000, CURRENT_DATE - 10, CURRENT_DATE + 20, now()
FROM cli
JOIN public.proyectos proys ON proys.cliente_id = cli.id
WHERE proys.nombre = 'Smart Data'
ON CONFLICT DO NOTHING;

-- FACTURA SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.facturas (cliente_id, proyecto_id, numero, monto, estado, fecha_emision, fecha_vencimiento, created_at)
SELECT cli.id, proys.id, 'FAC-DESEO-001', 1000000, 'pendiente', CURRENT_DATE, CURRENT_DATE + 30, now()
FROM cli
JOIN public.proyectos proys ON proys.cliente_id = cli.id
WHERE proys.nombre = 'Smart Data'
ON CONFLICT DO NOTHING;

-- TRANSACCIONES SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.transacciones (cliente_id, proyecto_id, tipo, monto, metodo, estado, fecha, concepto, created_at)
SELECT cli.id, proys.id, 'ingreso', 500000, 'Transferencia', 'confirmado', CURRENT_DATE - 2, 'Anticipo factura FAC-DESEO-001', now()
FROM cli
JOIN public.proyectos proys ON proys.cliente_id = cli.id
WHERE proys.nombre = 'Smart Data'
ON CONFLICT DO NOTHING;
