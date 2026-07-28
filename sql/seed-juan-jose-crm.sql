-- ============================================================
-- SEED: Juan José Álvarez + Proyecto CRM DESEO DIGITAL
-- Solo columnas confirmadas como existentes
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado)
SELECT 'Juan José Álvarez', 'emprende.villavo@gmail.com', '300 000 0000', 'DESEO DIGITAL', 'Agencia de Marketing', 'Interno', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'emprende.villavo@gmail.com');

-- 2. PROYECTO
INSERT INTO public.proyectos (
  id, nombre, descripcion, cliente_id, cliente_nombre, servicios,
  estado, prioridad, fecha_inicio, fecha_fin, progreso,
  presupuesto, costo_actual, fase_administrativa, estado_pago,
  metodo_pago, creado_en, actualizado_en, codigo
)
SELECT
  gen_random_uuid(),
  'CRM DESEO DIGITAL',
  'Desarrollo y evolución del CRM interno de DESEO DIGITAL.',
  c.id,
  'Juan José Álvarez',
  ARRAY['Desarrollo', 'Consultoría', 'Automatización'],
  'Activo',
  'Alta',
  now()::date,
  now()::date,
  35,
  15000000,
  4200000,
  'Operación',
  'anticipo',
  'Transferencia',
  now()::text,
  now()::text,
  'PRY-CRM-001'
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.proyectos p
    WHERE p.cliente_id = c.id AND p.nombre = 'CRM DESEO DIGITAL'
  );

-- 3. SERVICIOS BASE (solo columnas existentes)
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
SELECT 'Consultoría CRM', 'consultoria', 'Auditoría, roadmap y optimización del CRM', 2500000, '1 mes', ARRAY['Roadmap', 'Sesiones'], 'Activo', 1, now()::text
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Consultoría CRM');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
SELECT 'Desarrollo a medida', 'desarrollo', 'Customizaciones, integraciones y módulos', 1800000, '2 meses', ARRAY['React', 'Supabase', 'Vercel'], 'Activo', 1, now()::text
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Desarrollo a medida');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
SELECT 'Automatización n8n', 'automatizacion', 'Flujos, WhatsApp, webhooks y alertas', 1200000, '1 mes', ARRAY['n8n', 'WhatsApp'], 'Activo', 1, now()::text
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Automatización n8n');

-- 4. TAREAS INICIALES
INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Definir estructura final del CRM', 'Cierre de módulos base, UI compacta y verificación producción.', now()::text, 'Alta', 'En progreso', 'Tarea', p.id, c.id
FROM public.proyectos p
JOIN public.clientes c ON c.email = 'emprende.villavo@gmail.com'
WHERE p.nombre = 'CRM DESEO DIGITAL'
  AND NOT EXISTS (
    SELECT 1 FROM public.tareas t WHERE t.proyecto_id = p.id AND t.titulo = 'Definir estructura final del CRM'
  );

INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Activar Gemini y Resend en producción', 'Verificar chat IA y plantillas de email transaccionales.', now()::text, 'Alta', 'Pendiente', 'Tarea', p.id, c.id
FROM public.proyectos p
JOIN public.clientes c ON c.email = 'emprende.villavo@gmail.com'
WHERE p.nombre = 'CRM DESEO DIGITAL'
  AND NOT EXISTS (
    SELECT 1 FROM public.tareas t WHERE t.proyecto_id = p.id AND t.titulo = 'Activar Gemini y Resend en producción'
  );

-- 5. FACTURA
INSERT INTO public.facturas (numero, concepto, monto, estado, fecha_emision, fecha_vencimiento, cliente_id, proyecto_id, created_at)
SELECT 'FAC-CRM-001', 'Anticosto inicial CRM DESEO DIGITAL', 1500000, 'pendiente', now()::date, now()::date, c.id, p.id, now()::text
FROM public.clientes c
JOIN public.proyectos p ON p.cliente_id = c.id AND p.nombre = 'CRM DESEO DIGITAL'
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.facturas WHERE numero = 'FAC-CRM-001');

-- 6. CONTRATO
INSERT INTO public.contratos (titulo, cliente_id, proyecto_id, contenido, estado, created_at)
SELECT 'Contrato CRM DESEO DIGITAL', c.id, p.id, 'Contrato de desarrollo y operación del CRM interno bajo alcance acordado.', 'borrador', now()::text
FROM public.clientes c
JOIN public.proyectos p ON p.cliente_id = c.id AND p.nombre = 'CRM DESEO DIGITAL'
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.contratos ct WHERE ct.cliente_id = c.id AND ct.proyecto_id = p.id AND ct.titulo = 'Contrato CRM DESEO DIGITAL'
  );

-- 7. DOCUMENTO
INSERT INTO public.documentos (titulo, tipo, url, proyecto_id, cliente_id, creado_en)
SELECT 'Propuesta inicial CRM', 'pdf', 'https://crmadd.vercel.app', p.id, c.id, now()::text
FROM public.clientes c
JOIN public.proyectos p ON p.cliente_id = c.id AND p.nombre = 'CRM DESEO DIGITAL'
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.documentos d WHERE d.cliente_id = c.id AND d.proyecto_id = p.id AND d.titulo = 'Propuesta inicial CRM'
  );
