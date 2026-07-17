-- CLIENTE PRINCIPAL
INSERT INTO public.clientes (id, nombre, email, telefono, empresa, nicho, origen, estado, created_at)
SELECT nextval('clientes_id_seq'::regclass), 'juan José', 'juan@deseodigital.com', '300 123 4567', 'Deseo Digital', 'Agencia de Marketing Digital', 'Lead', 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'juan@deseodigital.com');

-- PROYECTOS DE JUAN JOSÉ (ids texto explícitos)
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.proyectos (id, cliente_id, nombre, descripcion, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, creado_en, actualizado_en)
SELECT gen_random_uuid()::text, cli.id, 'Smart Data', 'Plataforma de inteligencia comercial con dashboards y reporting automático para decisiones de negocio.', 'en_progreso', 'Operación', 35, 4500000, '2026-06-01', '2026-12-15', 'alta', now(), now() FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Smart Data');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.proyectos (id, cliente_id, nombre, descripcion, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, creado_en, actualizado_en)
SELECT gen_random_uuid()::text, cli.id, 'Lo Que Deseo', 'Ecosistema digital: web, funnel y crecimiento de audiencia para marca personal.', 'en_progreso', 'Onboarding', 20, 3200000, '2026-07-01', '2026-11-30', 'alta', now(), now() FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Lo Que Deseo');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.proyectos (id, cliente_id, nombre, descripcion, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, creado_en, actualizado_en)
SELECT gen_random_uuid()::text, cli.id, 'Escala Digital', 'Modelo de captación y WhatsApp Business para escalar ventas.', 'propuesta', 'Propuesta', 5, 1800000, '2026-08-01', '2026-10-30', 'media', now(), now() FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Escala Digital');

-- TAREAS SEMILLA
WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Onboarding cliente y acceso CRM', 'Crear usuario, permisos iniciales y carga de brief.', 'pendiente', 'alta', (CURRENT_DATE + 2)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Onboarding cliente y acceso CRM');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Brief inicial Smart Data', 'Definir KPIs, fuentes de datos y access tokens.', 'pendiente', 'alta', (CURRENT_DATE + 4)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Brief inicial Smart Data');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Wireframes Lo Que Deseo', 'Validar pantallas clave con Juan antes de diseño.', 'pendiente', 'media', (CURRENT_DATE + 6)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Wireframes Lo Que Deseo');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Script de cierre WhatsApp', 'Redactar flujo de conversación y validación de interesados.', 'pendiente', 'media', (CURRENT_DATE + 7)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Script de cierre WhatsApp');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Mapa de contenidos Escala Digital', 'Definir pilares, formatos y frecuencia por canal.', 'pendiente', 'baja', (CURRENT_DATE + 10)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Mapa de contenidos Escala Digital');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Configurar Registro DNS y Vercel', 'Deploy inicial y configuración de dominio.', 'pendiente', 'alta', (CURRENT_DATE + 3)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Configurar Registro DNS y Vercel');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'juan@deseodigital.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, asignado_a, created_at)
SELECT proys.id, 'Integrar Resend en staging', 'Prueba real de envío y plantillas.', 'pendiente', 'media', (CURRENT_DATE + 5)::text, 'Juan José', now()
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Integrar Resend en staging');

-- SERVICIOS POR PAQUETE
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Pack Elite', 'Paquete', '4 Reels/mes, 5 Historias/día, gestión de campañas.', 2000000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Pack Elite');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Landing + Funnel', 'Paquete', 'Diseño web, copy de conversión y automatización básica.', 1800000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Landing + Funnel');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Branding Express', 'Individual', 'Logo, paleta, manual básico y piezas iniciales.', 650000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Branding Express');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Campaña Ads', 'Individual', 'Creativos, métricas y optimización semanal.', 900000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Campaña Ads');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Social Media 1 mes', 'Individual', 'Calendario, 12 piezas e informe mensual.', 750000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Social Media 1 mes');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Consultoría Estratégica', 'Individual', 'Sesión de 2h con plan accionable.', 500000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Consultoría Estratégica');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, estado, created_at)
SELECT 'Automatización n8n', 'Individual', 'Workflow inicial, documentación y entrenamiento básico.', 850000, 'activo', now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Automatización n8n');

-- OPORTUNIDADES SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.oportunidades (cliente_id, nombre, etapa, valor, probabilidad, created_at)
SELECT cli.id, 'Upsell Escala Digital -> automatización', 'Propuesta', 850000, 40, now()
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE cliente_id = cli.id AND nombre = 'Upsell Escala Digital -> automatización');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.oportunidades (cliente_id, nombre, etapa, valor, probabilidad, created_at)
SELECT cli.id, 'Renovación Smart Data Q4', 'Negociación', 1200000, 60, now()
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE cliente_id = cli.id AND nombre = 'Renovación Smart Data Q4');

-- INTERACCIONES INICIALES
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.interacciones (cliente_id, tipo, asunto, contenido, usuario, created_at)
SELECT cli.id, 'llamada', 'Discovery comercial', 'Llamada de discovery: objetivos y presupuesto.', 'Juan José', now()
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.interacciones WHERE cliente_id = cli.id AND tipo = 'llamada' AND asunto = 'Discovery comercial');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.interacciones (cliente_id, tipo, asunto, contenido, usuario, created_at)
SELECT cli.id, 'correo', 'Propuesta enviada', 'Envío de propuesta Pack Elite.', 'Juan José', now()
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.interacciones WHERE cliente_id = cli.id AND tipo = 'correo' AND asunto = 'Propuesta enviada');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.interacciones (cliente_id, tipo, asunto, contenido, usuario, created_at)
SELECT cli.id, 'reunion', 'Kick-off Lo Que Deseo', 'Reunión kick-off Lo Que Deseo.', 'Juan José', now()
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.interacciones WHERE cliente_id = cli.id AND tipo = 'reunion' AND asunto = 'Kick-off Lo Que Deseo');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com')
INSERT INTO public.interacciones (cliente_id, tipo, asunto, contenido, usuario, created_at)
SELECT cli.id, 'nota', 'Seguimiento', 'Interesado en automatizar cobros.', 'Juan José', now()
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.interacciones WHERE cliente_id = cli.id AND tipo = 'nota' AND asunto = 'Seguimiento');

-- CONTRATO SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'),
proy AS (SELECT id FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Smart Data')
INSERT INTO public.contratos (cliente_id, proyecto_id, tipo, estado, titulo, contenido, valor, fecha_inicio, fecha_fin, created_at, updated_at)
SELECT cli.id, proy.id, 'prestacion_servicios', 'activo', 'Contrato Smart Data', 'Prestación de servicios', 2000000, CURRENT_DATE - 10, CURRENT_DATE + 20, now(), now()
FROM cli, proy
WHERE NOT EXISTS (SELECT 1 FROM public.contratos WHERE cliente_id = cli.id AND proyecto_id = proy.id);

-- FACTURA SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'),
proy AS (SELECT id FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Smart Data')
INSERT INTO public.facturas (cliente_id, proyecto_id, numero, monto, estado_pago, estado, tipo, subtotal, iva, total, moneda, fecha_emision, fecha_vencimiento, created_at)
SELECT cli.id, proy.id, 'FAC-DESEO-001', 1000000, 'pendiente', 'emitida', 'electronica', 1000000, 0, 1000000, 'COP', CURRENT_DATE, CURRENT_DATE + 30, now()
FROM cli, proy
WHERE NOT EXISTS (SELECT 1 FROM public.facturas WHERE cliente_id = cli.id AND proyecto_id = proy.id AND numero = 'FAC-DESEO-001');

-- TRANSACCIONES SEMILLA
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'juan@deseodigital.com'),
proy AS (SELECT id FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Smart Data')
INSERT INTO public.transacciones (cliente_id, proyecto_id, tipo, categoria, monto, moneda, forma_pago, descripcion, fecha, created_at)
SELECT cli.id, proy.id, 'ingreso', 'anticipo', 500000, 'COP', 'Transferencia', 'Anticipo factura FAC-DESEO-001', CURRENT_DATE, now()
FROM cli, proy
WHERE NOT EXISTS (SELECT 1 FROM public.transacciones WHERE cliente_id = cli.id AND proyecto_id = proy.id AND descripcion = 'Anticipo factura FAC-DESEO-001');
