-- ============================================================
-- SEED: Juan José Álvarez + Proyecto CRM DESEO DIGITAL
-- 100% alineado al schema real de Supabase
-- ============================================================

-- 1. CLIENTE
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado, favorito, codigo)
SELECT 'Juan José Álvarez', 'emprende.villavo@gmail.com', '300 000 0000', 'DESEO DIGITAL', 'Agencia de Marketing', 'Interno', 'Activo', true, 'CLI-CRM-001'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'emprende.villavo@gmail.com');

-- 2. PROYECTO (id es text, fechas texto)
INSERT INTO public.proyectos (
  id, nombre, descripcion, cliente_id, cliente_nombre, servicios,
  estado, prioridad, fecha_inicio, fecha_fin, progreso,
  presupuesto, costo_actual, fase_administrativa, estado_pago,
  metodo_pago, creado_en, actualizado_en, codigo
)
SELECT
  'PRY-CRM-001',
  'CRM DESEO DIGITAL',
  'Desarrollo y evolución del CRM interno de DESEO DIGITAL.',
  c.id,
  'Juan José Álvarez',
  ARRAY['Desarrollo', 'Consultoría', 'Automatización'],
  'Activo',
  'Alta',
  now()::text,
  now()::text,
  35,
  15000000,
  4200000,
  'Operación',
  'anticipo',
  'Transferencia',
  now(),
  now(),
  'PRY-CRM-001'
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.proyectos p
    WHERE p.cliente_id = c.id AND p.nombre = 'CRM DESEO DIGITAL'
  );

-- 3. SERVICIOS BASE
INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
SELECT 'Consultoría CRM', 'consultoria', 'Auditoría, roadmap y optimización del CRM', 2500000, '1 mes', ARRAY['Roadmap', 'Sesiones'], 'Activo', 1, now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Consultoría CRM');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
SELECT 'Desarrollo a medida', 'desarrollo', 'Customizaciones, integraciones y módulos', 1800000, '2 meses', ARRAY['React', 'Supabase', 'Vercel'], 'Activo', 1, now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Desarrollo a medida');

INSERT INTO public.servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
SELECT 'Automatización n8n', 'automatizacion', 'Flujos, WhatsApp, webhooks y alertas', 1200000, '1 mes', ARRAY['n8n', 'WhatsApp'], 'Activo', 1, now()
WHERE NOT EXISTS (SELECT 1 FROM public.servicios WHERE nombre = 'Automatización n8n');

-- 4. TAREAS INICIALES
INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Definir estructura final del CRM', 'Cierre de módulos base, UI compacta y verificación producción.', now()::text, 'Alta', 'En progreso', 'Tarea', 'PRY-CRM-001', c.id
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.tareas t WHERE t.proyecto_id = 'PRY-CRM-001' AND t.titulo = 'Definir estructura final del CRM'
  );

INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Activar Gemini y Resend en producción', 'Verificar chat IA y plantillas de email transaccionales.', now()::text, 'Alta', 'Pendiente', 'Tarea', 'PRY-CRM-001', c.id
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.tareas t WHERE t.proyecto_id = 'PRY-CRM-001' AND t.titulo = 'Activar Gemini y Resend en producción'
  );

-- 5. FACTURA (schema real: sin items, con tipo/subtotal/iva/total/moneda/estado/notas)
INSERT INTO public.facturas (numero, proyecto_id, monto, concepto, estado_pago, fecha_emision, fecha_vencimiento, cliente_id, tipo, subtotal, iva, total, moneda, estado, notas, created_at)
SELECT 'FAC-CRM-001', 'PRY-CRM-001', 1500000, 'Anticosto inicial CRM DESEO DIGITAL', 'pendiente', now()::date, now()::date, c.id, 'factura', 1500000, 0, 1500000, 'COP', 'pendiente', 'Seed automático', now()
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.facturas WHERE numero = 'FAC-CRM-001');

-- 6. CONTRATO (schema real: texto proyecto_id, tipo, numero, fecha_inicio/fin date, valor, estado enum, created_at timestamptz)
INSERT INTO public.contratos (titulo, cliente_id, proyecto_id, tipo, numero, contenido, estado, fecha_inicio, fecha_fin, valor, created_at)
SELECT 'Contrato inicial - CRM DESEO DIGITAL', c.id, 'PRY-CRM-001', 'prestacion_servicios', 'CTO-CRM-001', 'Contrato de desarrollo y operación del CRM interno bajo alcance acordado.', 'borrador', now()::date, now()::date, 15000000, now()
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.contratos ct WHERE ct.cliente_id = c.id AND ct.proyecto_id = 'PRY-CRM-001' AND ct.numero = 'CTO-CRM-001'
  );

-- 7. DOCUMENTO (schema real: sin proyecto_id/cliente_id; usa entidad_tipo/entidad_id)
INSERT INTO public.documentos (titulo, tipo, url, entidad_tipo, entidad_id, usuario, creado_en)
SELECT 'Propuesta inicial CRM', 'pdf', 'https://crmadd.vercel.app', 'proyecto', 'PRY-CRM-001', 'Juan José Álvarez', now()
FROM public.clientes c
WHERE c.email = 'emprende.villavo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.documentos d WHERE d.entidad_tipo = 'proyecto' AND d.entidad_id = 'PRY-CRM-001' AND d.titulo = 'Propuesta inicial CRM'
  );
