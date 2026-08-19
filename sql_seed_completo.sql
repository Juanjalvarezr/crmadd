-- DESEO DIGITAL - Seed completo CRM
-- Ejecutar en el SQL Editor de Supabase en orden.
-- Proyecto: fumubmlcaabyrbzsthmt

-- 1) Limpiar duplicados en equipo, dejar solo 3 válidos
DELETE FROM equipo
WHERE email NOT IN (
  'juan@deseodigital.com',
  'jessica@deseodigital.com',
  'pedro@deseodigital.com'
);

INSERT INTO equipo (nombre, email, rol, especialidad, estado)
VALUES
  ('Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia', 'Activo'),
  ('Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web', 'Activo'),
  ('Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Branding', 'Activo')
ON CONFLICT (email) DO NOTHING;

-- 2) Cliente base y configuración
INSERT INTO clientes (nombre, email, telefono, empresa, nicho, estado, favorito)
VALUES ('Juan Jose Alvarez', 'juanjosealvarez@gmail.com', '320 369 8476', 'DESEO DIGITAL', 'Tecnología', 'Activo', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, descripcion, direccion, ciudad, pais)
VALUES ('DESEO DIGITAL', 'contacto@deseodigital.com', '320 369 8476', 'https://deseodigital.com', 'Agencia especializada en Marketing Digital y SEO', 'Calle 10 #20-30', 'Medellín', 'Colombia')
ON CONFLICT DO NOTHING;

-- 3) Servicios base
INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad)
VALUES
  ('Diseño Web Profesional', 'Desarrollo', 'Landing page o sitio corporativo', 2500000, '2 semanas', ARRAY['Diseño responsive','SEO básico','Hosting 1 año'], 'Activo', 5),
  ('Desarrollo Full Stack', 'Desarrollo', 'App web o móvil completa', 8500000, '1 mes', ARRAY['Frontend','Backend','Base de datos','Despliegue'], 'Activo', 4),
  ('SEO Optimization', 'Marketing', 'Auditoría y optimización SEO', 1200000, '1 semana', ARRAY['Auditoría','Keywords','Reporte mensual'], 'Activo', 3)
ON CONFLICT DO NOTHING;

-- 4) Reglas AI + Prompts + Conocimiento base
INSERT INTO reglas_negocio_ai (categoria, instruccion)
VALUES
  ('ventas', 'Siempre mencionar el anticipo del 50% antes de empezar proyecto'),
  ('operaciones', 'Validar disponibilidad de equipo antes de asignar tarea'),
  ('branding', 'Usar solo la paleta de colores oficial de la agencia')
ON CONFLICT DO NOTHING;

INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template)
VALUES
  ('prompt_001', 'director_estrategico', 'Eres el Director Estratégico Senior de DESEO DIGITAL.', 'Redacta una propuesta persuasiva para {{clienteNombre}}. Servicios: {{servicios}}. Enfócate en el ROI y el anticipo del 50%.'),
  ('prompt_002', 'cfo_agencia', 'Eres el CFO de DESEO DIGITAL.', 'Analiza el flujo de caja. Anticipos recaudados: {{montoPagado}}. Presupuesto total: {{presupuesto}}.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conocimiento_agencia (titulo, contenido, categoria)
VALUES ('Onboarding cliente', 'Pasos: contrato, acceso aDrive, calendar, chat IA.', 'operaciones')
ON CONFLICT DO NOTHING;

-- 5) Oportunidades realistas
INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, servicios_interes, etapa, estado, probabilidad)
SELECT 'Landing Corporativa', id, 'DESEO DIGITAL', 8500000, ARRAY['Diseño Web Profesional'], 'Cierre', 'Abierta', 75
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, servicios_interes, etapa, estado, probabilidad)
SELECT 'SEO Q4', id, 'DESEO DIGITAL', 1200000, ARRAY['SEO Optimization'], 'Propuesta', 'Abierta', 40
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

-- 6) Proyecto + Tareas
INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, estado_pago, fase_administrativa)
SELECT 'PROJ-001', 'Agencia Deseo Digital', 'Proyecto interno CRM', id, 'DESEO DIGITAL', ARRAY['Diseño Web Profesional'], 'en_progreso', 'alta', '2026-06-01', '2026-12-31', 30, 15000000, 4500000, 'parcial', 'operacion'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
SELECT 'Definir alcance CRM', 'Reunir requisitos y cierre de propuesta', CURRENT_DATE + 2, 'Alta', 'Pendiente', 'Tarea', 'PROJ-001', id, 1
FROM clientes WHERE email = 'juanjosealvarez@gmail.com';

INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
SELECT 'Diseño UI/UX', 'Prototipos y pruebas de contraste', CURRENT_DATE + 5, 'Media', 'En progreso', 'Tarea', 'PROJ-001', id, 2
FROM clientes WHERE email = 'juanjosealvarez@gmail.com';

INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
SELECT 'Entrega cliente', 'Demo funcional y capacitación', CURRENT_DATE + 10, 'Alta', 'Pendiente', 'Cita', 'PROJ-001', id, 1
FROM clientes WHERE email = 'juanjosealvarez@gmail.com';

-- 7) Factura + Pagos + Contrato + Transacciones
INSERT INTO facturas (numero_factura, proyecto_id, cliente_id, estado, total, subtotal, iva, descuento, metodo_pago, fecha_emision, fecha_vencimiento)
SELECT 'FAC-001', 'PROJ-001', id, 'Enviada', 15000000, 12500000, 2500000, 0, 'transferencia', CURRENT_DATE - 10, CURRENT_DATE + 20
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO pagos (factura_id, monto, metodo_pago, referencia, fecha_pago)
SELECT 1, 4500000, 'transferencia', 'REF-001', CURRENT_DATE - 8
WHERE EXISTS (SELECT 1 FROM facturas WHERE numero_factura = 'FAC-001');

INSERT INTO contratos (proyecto_id, cliente_id, estado, valor, fecha_inicio, fecha_fin)
SELECT 'PROJ-001', id, 'Activo', 15000000, CURRENT_DATE - 10, CURRENT_DATE + 120
FROM clientes WHERE email = 'juanjosealvarez@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, concepto, fecha)
SELECT 'PROJ-001', id, 'Ingreso', 4500000, 'Pago inicial', CURRENT_DATE - 8
FROM clientes WHERE email = 'juanjosealvarez@gmail.com';

INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, concepto, fecha)
SELECT 'PROJ-001', id, 'Egreso', 1200000, 'Hosting y dominio', CURRENT_DATE - 5
FROM clientes WHERE email = 'juanjosealvarez@gmail.com';

-- 8) Email marketing base
INSERT INTO campanas_email (nombre, asunto, estado, destinatarios)
VALUES ('Bienvenida DESEO', 'Bienvenido a DESEO DIGITAL', 'borrador', ARRAY['juanjosealvarez@gmail.com'])
ON CONFLICT DO NOTHING;

INSERT INTO plantillas_email (nombre, asunto, contenido, categoria)
VALUES ('Propuesta estándar', 'Propuesta {{cliente}}', 'Hola {{cliente}}, ...', 'ventas')
ON CONFLICT DO NOTHING;

-- 9) Interacción inicial
INSERT INTO interacciones (cliente_id, tipo, asunto, contenido, usuario)
SELECT id, 'WhatsApp', 'Consulta inicial', 'Interés por servicios digitales', 'Asistente IA'
FROM clientes WHERE email = 'juanjosealvarez@gmail.com';

-- 10) Refrescar vistas materializadas si existen; si no, las creas aparte
-- CREATE OR REPLACE VIEW vista_kpi_dashboard AS ...
-- Esta vista ya viene en supabase_schema.sql
