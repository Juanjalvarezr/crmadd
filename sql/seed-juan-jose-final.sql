-- Seed 100% idempotente Juan José — sinDELETE, usa ON CONFLICT

-- Cliente
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado, codigo)
VALUES ('Juan José', 'emprende.villavo@gmail.com', '300 123 4567', 'Deseo Digital', 'Agencia de Marketing Digital', 'Lead', 'Activo', 'CLI-001')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, email = EXCLUDED.email;

-- Proyectos (id:text | unique en codigo)
INSERT INTO public.proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, fase_administrativa, codigo)
SELECT 'PRY-001', 'Smart Data', 'Plataforma de inteligencia comercial con dashboards y reporting automático.', c.id, c.empresa, 'en_progreso', 'alta', '2026-06-01', '2026-12-15', 35, 4500000, 'operacion', 'PRY-001'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, fase_administrativa, codigo)
SELECT 'PRY-002', 'Lo Que Deseo', 'Ecosistema digital: web, funnel y crecimiento de audiencia.', c.id, c.empresa, 'en_progreso', 'alta', '2026-07-01', '2026-11-30', 20, 3200000, 'onboarding', 'PRY-002'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, fase_administrativa, codigo)
SELECT 'PRY-003', 'Escala Digital', 'Modelo de captación y WhatsApp Business para escalar ventas.', c.id, c.empresa, 'propuesta', 'media', '2026-08-01', '2026-10-30', 5, 1800000, 'propuesta', 'PRY-003'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
ON CONFLICT (codigo) DO NOTHING;

-- Tareas (sin unique) — solo inserta si no existe
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT 'PRY-001', 'Onboarding cliente y acceso CRM', 'Crear usuario, permisos iniciales y carga de brief.', 'Pendiente', 'Alta', (CURRENT_DATE + 2)::text, c.id
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.tareas WHERE proyecto_id = 'PRY-001' AND titulo = 'Onboarding cliente y acceso CRM');

INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT 'PRY-001', 'Brief inicial Smart Data', 'Definir KPIs, fuentes de datos y access tokens.', 'Pendiente', 'Alta', (CURRENT_DATE + 4)::text, c.id
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.tareas WHERE proyecto_id = 'PRY-001' AND titulo = 'Brief inicial Smart Data');

INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, cliente_id)
SELECT 'PRY-002', 'Wireframes Lo Que Deseo', 'Validar pantallas clave con Juan antes de diseño.', 'Pendiente', 'Media', (CURRENT_DATE + 6)::text, c.id
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.tareas WHERE proyecto_id = 'PRY-002' AND titulo = 'Wireframes Lo Que Deseo');

-- Oportunidad
INSERT INTO public.oportunidades (nombre, cliente_id, cliente_nombre, valor, estado)
SELECT 'Oportunidad Escala Digital', c.id, c.empresa, 1800000, 'Abierta'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE nombre = 'Oportunidad Escala Digital');

-- Transacciones (id:uuid | columnas reales)
INSERT INTO public.transacciones (tipo, categoria, monto, moneda, forma_pago, descripcion, fecha, cliente_id, proyecto_id)
SELECT 'ingreso', 'Anticipo', 1500000, 'COP', 'Transferencia', 'Anticipo proyecto Smart Data', CURRENT_DATE, c.id, 'PRY-001'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.transacciones WHERE descripcion = 'Anticipo proyecto Smart Data');

-- Facturas
INSERT INTO public.facturas (numero, concepto, monto, estado_pago, proyecto_id, cliente_id)
SELECT 'FAC-001', 'Anticipo proyecto Smart Data', 1500000, 'pendiente', 'PRY-001', c.id
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
ON CONFLICT (numero) DO NOTHING;

-- Contratos
INSERT INTO public.contratos (titulo, cliente_id, proyecto_id, estado)
SELECT 'Contrato Smart Data', c.id, 'PRY-001', 'borrador'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.contratos WHERE titulo = 'Contrato Smart Data');

INSERT INTO public.contratos (titulo, cliente_id, proyecto_id, estado)
SELECT 'Contrato Lo Que Deseo', c.id, 'PRY-002', 'borrador'
FROM public.clientes c WHERE c.email = 'emprende.villavo@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.contratos WHERE titulo = 'Contrato Lo Que Deseo');

-- Servicios (unique nombre)
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'Community Management', 'contenido', 'Gestión de redes sociales y calendario editorial', 1200000, '1 mes', 'individual', 'Activo'
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'SEO Técnico', 'web', 'Auditoría, optimización y posicionamiento', 1800000, '2 meses', 'individual', 'Activo'
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, tipo, estado)
SELECT 'Paquete Lanzamiento', 'contenido', 'Estrategia, creativos y pauta inicial', 3500000, '3 meses', 'paquete', 'Activo'
ON CONFLICT (nombre) DO NOTHING;

-- Equipo (unique email)
INSERT INTO public.equipo (nombre, email, rol, especialidad)
SELECT 'Juan José', 'emprende.villavo@gmail.com', 'Admin', 'Dirección General'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.equipo (nombre, email, rol, especialidad)
SELECT 'Asistente', 'asistente@deseodigital.com', 'Creativo', 'Diseño y edición'
ON CONFLICT (email) DO NOTHING;
