-- SEED JUAN JOSÉ V2 — tipos alineados al schema real
-- id proyectos: uuid; tareas.cliente_id: bigint; sin columnas inexistentes

-- CLIENTE
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado)
SELECT 'Juan José', 'emprende.villavo@gmail.com', '300 123 4567', 'Deseo Digital', 'Agencia de Marketing Digital', 'Lead', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'emprende.villavo@gmail.com');

-- PROYECTOS (id es uuid, NO se inserta manualmente, usa DEFAULT)
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.proyectos (nombre, descripcion, cliente_id, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad)
SELECT 'Smart Data', 'Plataforma de inteligencia comercial con dashboards y reporting automático.', cli.id, 'en_progreso', 'operacion', 35, 4500000::numeric, '2026-06-01', '2026-12-15', 'alta'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Smart Data');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.proyectos (nombre, descripcion, cliente_id, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad)
SELECT 'Lo Que Deseo', 'Ecosistema digital: web, funnel y crecimiento de audiencia.', cli.id, 'en_progreso', 'onboarding', 20, 3200000::numeric, '2026-07-01', '2026-11-30', 'alta'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Lo Que Deseo');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.proyectos (nombre, descripcion, cliente_id, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad)
SELECT 'Escala Digital', 'Modelo de captación y WhatsApp Business para escalar ventas.', cli.id, 'propuesta', 'propuesta', 5, 1800000::numeric, '2026-08-01', '2026-10-30', 'media'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE cliente_id = cli.id AND nombre = 'Escala Digital');

-- TAREAS
WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'emprende.villavo@gmail.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT proys.id, 'Onboarding cliente y acceso CRM', 'Crear usuario, permisos iniciales y carga de brief.', 'Pendiente', 'Alta', (CURRENT_DATE + 2)::text, (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Onboarding cliente y acceso CRM');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'emprende.villavo@gmail.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT proys.id, 'Brief inicial Smart Data', 'Definir KPIs, fuentes de datos y access tokens.', 'Pendiente', 'Alta', (CURRENT_DATE + 4)::text, (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Brief inicial Smart Data');

WITH proys AS (
  SELECT p.id, p.nombre
  FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'emprende.villavo@gmail.com'
)
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT proys.id, 'Wireframes Lo Que Deseo', 'Validar pantallas clave con Juan antes de diseño.', 'Pendiente', 'Media', (CURRENT_DATE + 6)::text, (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.tareas t WHERE t.proyecto_id = proys.id AND t.titulo = 'Wireframes Lo Que Deseo');

-- OPORTUNIDAD
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.oportunidades (nombre, cliente_id, valor, estado)
SELECT 'Oportunidad Escala Digital', cli.id, 1800000::numeric, 'Abierta'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE cliente_id = cli.id AND nombre = 'Oportunidad Escala Digital');

-- TRANSACCIONES
WITH proys AS (
  SELECT p.id FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'emprende.villavo@gmail.com' AND p.nombre = 'Smart Data'
)
INSERT INTO public.transacciones (concepto, monto, tipo, estado, proyecto_id, cliente_id)
SELECT 'Anticipo Smart Data', 1500000::numeric, 'ingreso', 'pendiente', proys.id, (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.transacciones WHERE concepto = 'Anticipo Smart Data');

-- FACTURAS
WITH proys AS (
  SELECT p.id FROM public.proyectos p
  JOIN public.clientes c ON c.id = p.cliente_id
  WHERE c.email = 'emprende.villavo@gmail.com' AND p.nombre = 'Smart Data'
)
INSERT INTO public.facturas (numero, concepto, monto, estado, proyecto_id, cliente_id)
SELECT 'FAC-001', 'Anticipo proyecto Smart Data', 1500000::numeric, 'pendiente', proys.id, (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
FROM proys
WHERE NOT EXISTS (SELECT 1 FROM public.facturas WHERE numero = 'FAC-001');

-- CONTRATOS
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.contratos (titulo, cliente_id, estado)
SELECT 'Contrato Smart Data', cli.id, 'borrador'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.contratos WHERE titulo = 'Contrato Smart Data');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.contratos (titulo, cliente_id, estado)
SELECT 'Contrato Lo Que Deseo', cli.id, 'borrador'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.contratos WHERE titulo = 'Contrato Lo Que Deseo');

-- SERVICIOS BASE
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'Community Management', 'contenido', 'Gestión de redes sociales y calendario editorial', 1200000::numeric, '1 mes', 'individual', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Community Management');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'SEO Técnico', 'web', 'Auditoría, optimización y posicionamiento', 1800000::numeric, '2 meses', 'individual', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'SEO Técnico');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'Paquete Lanzamiento', 'contenido', 'Estrategia, creativos y pauta inicial', 3500000::numeric, '3 meses', 'paquete', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Paquete Lanzamiento');

-- EQUIPO
INSERT INTO public.equipo (nombre, email, rol, especialidad)
SELECT 'Juan José', 'emprende.villavo@gmail.com', 'Admin', 'Dirección General'
WHERE NOT EXISTS (SELECT 1 FROM public.equipo WHERE email = 'emprende.villavo@gmail.com');

INSERT INTO public.equipo (nombre, email, rol, especialidad)
SELECT 'Asistente', 'asistente@deseodigital.com', 'Creativo', 'Diseño y edición'
WHERE NOT EXISTS (SELECT 1 FROM public.equipo WHERE email = 'asistente@deseodigital.com');
