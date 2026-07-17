-- SEED JUAN JOSÉ V3 — id proyectos:text, tareas.proyecto_id:text, sin columnas fantasma
-- IDs explícitos, idempotente

-- CLIENTE
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado, codigo)
SELECT 'Juan José', 'emprende.villavo@gmail.com', '300 123 4567', 'Deseo Digital', 'Agencia de Marketing Digital', 'Lead', 'Activo', 'CLI-001'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'emprende.villavo@gmail.com');

-- PROYECTOS (id:text explícito, sin default)
INSERT INTO public.proyectos (id, nombre, descripcion, cliente_id, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, codigo)
SELECT 'PRY-001', 'Smart Data', 'Plataforma de inteligencia comercial con dashboards y reporting automático.', id, 'en_progreso', 'operacion', 35, 4500000, '2026-06-01', '2026-12-15', 'alta', 'PRY-001'
FROM public.clientes WHERE email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.proyectos WHERE id = 'PRY-001');

INSERT INTO public.proyectos (id, nombre, descripcion, cliente_id, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, codigo)
SELECT 'PRY-002', 'Lo Que Deseo', 'Ecosistema digital: web, funnel y crecimiento de audiencia.', id, 'en_progreso', 'onboarding', 20, 3200000, '2026-07-01', '2026-11-30', 'alta', 'PRY-002'
FROM public.clientes WHERE email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.proyectos WHERE id = 'PRY-002');

INSERT INTO public.proyectos (id, nombre, descripcion, cliente_id, estado, fase_administrativa, progreso, presupuesto, fecha_inicio, fecha_fin, prioridad, codigo)
SELECT 'PRY-003', 'Escala Digital', 'Modelo de captación y WhatsApp Business para escalar ventas.', id, 'propuesta', 'propuesta', 5, 1800000, '2026-08-01', '2026-10-30', 'media', 'PRY-003'
FROM public.clientes WHERE email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.proyectos WHERE id = 'PRY-003');

-- TAREAS (proyecto_id:text)
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT 'PRY-001', 'Onboarding cliente y acceso CRM', 'Crear usuario, permisos iniciales y carga de brief.', 'Pendiente', 'Alta', (CURRENT_DATE + 2)::text, cli.id
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE proyecto_id = 'PRY-001' AND titulo = 'Onboarding cliente y acceso CRM');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT 'PRY-001', 'Brief inicial Smart Data', 'Definir KPIs, fuentes de datos y access tokens.', 'Pendiente', 'Alta', (CURRENT_DATE + 4)::text, cli.id
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE proyecto_id = 'PRY-001' AND titulo = 'Brief inicial Smart Data');

WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT 'PRY-002', 'Wireframes Lo Que Deseo', 'Validar pantallas clave con Juan antes de diseño.', 'Pendiente', 'Media', (CURRENT_DATE + 6)::text, cli.id
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE proyecto_id = 'PRY-002' AND titulo = 'Wireframes Lo Que Deseo');

-- OPORTUNIDAD
WITH cli AS (SELECT id FROM public.clientes WHERE email = 'emprende.villavo@gmail.com')
INSERT INTO public.oportunidades (nombre, cliente_id, valor, estado)
SELECT 'Oportunidad Escala Digital', cli.id, 1800000, 'Abierta'
FROM cli
WHERE NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE nombre = 'Oportunidad Escala Digital');

-- TRANSACCIONES
INSERT INTO public.transacciones (concepto, monto, tipo, estado, proyecto_id, cliente_id)
SELECT 'Anticipo Smart Data', 1500000, 'ingreso', 'pendiente', 'PRY-001', id
FROM public.clientes WHERE email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.transacciones WHERE concepto = 'Anticipo Smart Data');

-- FACTURAS
INSERT INTO public.facturas (numero, concepto, monto, estado, proyecto_id, cliente_id)
SELECT 'FAC-001', 'Anticipo proyecto Smart Data', 1500000, 'pendiente', 'PRY-001', id
FROM public.clientes WHERE email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.facturas WHERE numero = 'FAC-001');

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

-- SERVICIOS
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'Community Management', 'contenido', 'Gestión de redes sociales y calendario editorial', 1200000, '1 mes', 'individual', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Community Management');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'SEO Técnico', 'web', 'Auditoría, optimización y posicionamiento', 1800000, '2 meses', 'individual', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'SEO Técnico');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'Paquete Lanzamiento', 'contenido', 'Estrategia, creativos y pauta inicial', 3500000, '3 meses', 'paquete', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Paquete Lanzamiento');

-- EQUIPO
INSERT INTO public.equipo (nombre, email, rol, especialidad)
SELECT 'Juan José', 'emprende.villavo@gmail.com', 'Admin', 'Dirección General'
WHERE NOT EXISTS (SELECT 1 FROM public.equipo WHERE email = 'emprende.villavo@gmail.com');

INSERT INTO public.equipo (nombre, email, rol, especialidad)
SELECT 'Asistente', 'asistente@deseodigital.com', 'Creativo', 'Diseño y edición'
WHERE NOT EXISTS (SELECT 1 FROM public.equipo WHERE email = 'asistente@deseodigital.com');
