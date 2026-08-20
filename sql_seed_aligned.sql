-- DESEO DIGITAL - Seed CRM alineado a tablas reales de Supabase
-- Ejecutar en SQL Editor de Supabase.

-- 1) Equipo base (unique por email)
INSERT INTO equipo (nombre, email, rol, especialidad, estado)
SELECT 'Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM equipo WHERE email = 'juan@deseodigital.com');

INSERT INTO equipo (nombre, email, rol, especialidad, estado)
SELECT 'Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM equipo WHERE email = 'jessica@deseodigital.com');

INSERT INTO equipo (nombre, email, rol, especialidad, estado)
SELECT 'Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Branding', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM equipo WHERE email = 'pedro@deseodigital.com');

-- 2) Cliente base (unique por email)
INSERT INTO clientes (nombre, email, telefono, empresa, nicho, estado, favorito)
SELECT 'Juan Jose Alvarez', 'juanjosealvarez@gmail.com', '320 369 8476', 'DESEO DIGITAL', 'Tecnología', 'Activo', true
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'juanjosealvarez@gmail.com');

-- 3) Configuración empresa (sin unique, evitar duplicado lógico)
INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, descripcion, direccion, ciudad, pais)
SELECT 'DESEO DIGITAL', 'contacto@deseodigital.com', '320 369 8476', 'https://deseodigital.com', 'Agencia especializada en Marketing Digital y SEO', 'Calle 10 #20-30', 'Medellín', 'Colombia'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_empresa LIMIT 1);

-- 4) Servicios base (sin unique, evitar duplicados)
INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad)
SELECT 'Diseño Web Profesional', 'Desarrollo', 'Landing page o sitio corporativo', 2500000, '2 semanas', ARRAY['Diseño responsive','SEO básico','Hosting 1 año'], 'Activo', 5
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'Diseño Web Profesional');

INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad)
SELECT 'Desarrollo Full Stack', 'Desarrollo', 'App web o móvil completa', 8500000, '1 mes', ARRAY['Frontend','Backend','Base de datos','Despliegue'], 'Activo', 4
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'Desarrollo Full Stack');

INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad)
SELECT 'SEO Optimization', 'Marketing', 'Auditoría y optimización SEO', 1200000, '1 semana', ARRAY['Auditoría','Keywords','Reporte mensual'], 'Activo', 3
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'SEO Optimization');

-- 5) Reglas AI + Prompts + Conocimiento base
INSERT INTO reglas_ai (categoria, instruccion)
SELECT 'ventas', 'Siempre mencionar el anticipo del 50% antes de empezar proyecto'
WHERE NOT EXISTS (SELECT 1 FROM reglas_ai WHERE categoria = 'ventas');

INSERT INTO reglas_ai (categoria, instruccion)
SELECT 'operaciones', 'Validar disponibilidad de equipo antes de asignar tarea'
WHERE NOT EXISTS (SELECT 1 FROM reglas_ai WHERE categoria = 'operaciones');

INSERT INTO reglas_ai (categoria, instruccion)
SELECT 'branding', 'Usar solo la paleta de colores oficial de la agencia'
WHERE NOT EXISTS (SELECT 1 FROM reglas_ai WHERE categoria = 'branding');

INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template)
SELECT 'prompt_001', 'director_estrategico', 'Eres el Director Estratégico Senior de DESEO DIGITAL.', 'Redacta una propuesta persuasiva para {{clienteNombre}}. Servicios: {{servicios}}. Enfócate en el ROI y el anticipo del 50%.'
WHERE NOT EXISTS (SELECT 1 FROM prompts_ai WHERE id = 'prompt_001');

INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template)
SELECT 'prompt_002', 'cfo_agencia', 'Eres el CFO de DESEO DIGITAL.', 'Analiza el flujo de caja. Anticipos recaudados: {{montoPagado}}. Presupuesto total: {{presupuesto}}.'
WHERE NOT EXISTS (SELECT 1 FROM prompts_ai WHERE id = 'prompt_002');

INSERT INTO conocimiento_agencia (titulo, contenido, categoria)
SELECT 'Onboarding cliente', 'Pasos: contrato, acceso a Drive, calendar, chat IA.', 'operaciones'
WHERE NOT EXISTS (SELECT 1 FROM conocimiento_agencia WHERE titulo = 'Onboarding cliente');

-- 6) Oportunidades realistas
INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, servicios_interes, etapa, estado, probabilidad)
SELECT 'Landing Corporativa', c.id, 'DESEO DIGITAL', 8500000, ARRAY['Diseño Web Profesional'], 'Cierre', 'Abierta', 75
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE nombre = 'Landing Corporativa');

INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, servicios_interes, etapa, estado, probabilidad)
SELECT 'SEO Q4', c.id, 'DESEO DIGITAL', 1200000, ARRAY['SEO Optimization'], 'Propuesta', 'Abierta', 40
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE nombre = 'SEO Q4');

-- 7) Proyecto + Tareas
INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, estado_pago, fase_administrativa)
SELECT 'PROJ-001', 'Agencia Deseo Digital', 'Proyecto interno CRM', id, 'DESEO DIGITAL', ARRAY['Diseño Web Profesional'], 'en_progreso', 'alta', '2026-06-01', '2026-12-31', 30, 15000000, 4500000, 'parcial', 'operacion'
FROM clientes
WHERE email = 'juanjosealvarez@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM proyectos WHERE id = 'PROJ-001');

INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
SELECT 'Definir alcance CRM', 'Reunir requisitos y cierre de propuesta', CURRENT_DATE + 2, 'Alta', 'Pendiente', 'Tarea', 'PROJ-001', c.id, e.id
FROM clientes c
JOIN (SELECT id FROM equipo WHERE email = 'juan@deseodigital.com') e ON true
WHERE c.email = 'juanjosealvarez@gmail.com';

INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
SELECT 'Diseño UI/UX', 'Prototipos y pruebas de contraste', CURRENT_DATE + 5, 'Media', 'En progreso', 'Tarea', 'PROJ-001', c.id, e.id
FROM clientes c
JOIN (SELECT id FROM equipo WHERE email = 'jessica@deseodigital.com') e ON true
WHERE c.email = 'juanjosealvarez@gmail.com';

INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
SELECT 'Entrega cliente', 'Demo funcional y capacitación', CURRENT_DATE + 10, 'Alta', 'Pendiente', 'Cita', 'PROJ-001', c.id, e.id
FROM clientes c
JOIN (SELECT id FROM equipo WHERE email = 'juan@deseodigital.com') e ON true
WHERE c.email = 'juanjosealvarez@gmail.com';

-- 8) Factura + Pagos + Contrato + Transacciones
INSERT INTO facturas (proyecto_id, cliente_id, estado, total, subtotal, iva, descuento, metodo_pago, fecha_emision, fecha_vencimiento)
SELECT 'PROJ-001', c.id, 'Enviada', 15000000, 12500000, 2500000, 0, 'transferencia', CURRENT_DATE - 10, CURRENT_DATE + 20
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com';

INSERT INTO pagos (factura_id, monto, metodo_pago, referencia, fecha_pago)
SELECT 1, 4500000, 'transferencia', 'REF-001', CURRENT_DATE - 8
WHERE EXISTS (SELECT 1 FROM facturas WHERE id = 1);

INSERT INTO contratos (proyecto_id, cliente_id, estado, valor, fecha_inicio, fecha_fin)
SELECT 'PROJ-001', c.id, 'Activo', 15000000, CURRENT_DATE - 10, CURRENT_DATE + 120
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com';

INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, concepto, fecha)
SELECT 'PROJ-001', c.id, 'Ingreso', 4500000, 'Pago inicial', CURRENT_DATE - 8
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com';

INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, concepto, fecha)
SELECT 'PROJ-001', c.id, 'Egreso', 1200000, 'Hosting y dominio', CURRENT_DATE - 5
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com';

-- 9) Email marketing base
INSERT INTO campanas_email (nombre, asunto, estado, destinatarios)
SELECT 'Bienvenida DESEO', 'Bienvenido a DESEO DIGITAL', 'borrador', ARRAY['juanjosealvarez@gmail.com']
WHERE NOT EXISTS (SELECT 1 FROM campanas_email WHERE nombre = 'Bienvenida DESEO');

INSERT INTO plantillas_email (nombre, asunto, contenido, categoria)
SELECT 'Propuesta estándar', 'Propuesta {{cliente}}', 'Hola {{cliente}}, ...', 'ventas'
WHERE NOT EXISTS (SELECT 1 FROM plantillas_email WHERE nombre = 'Propuesta estándar');

-- 10) Interacción inicial
INSERT INTO interacciones (cliente_id, tipo, asunto, contenido, usuario)
SELECT c.id, 'WhatsApp', 'Consulta inicial', 'Interés por servicios digitales', 'Asistente IA'
FROM clientes c
WHERE c.email = 'juanjosealvarez@gmail.com';
