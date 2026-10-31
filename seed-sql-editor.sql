-- ============================================================
-- SEED PARA CRM DESEO DIGITAL - Datos realistas de prueba
-- Copia y pega esto en tu editor SQL de Supabase (https://supabase.com -> SQL Editor)
-- Luego ejecuta el script
-- ============================================================

-- 1. CONFIGURACIÓN EMPRESA
INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, logo_url, colores, descripcion, direccion, ciudad, pais, google_business_link) VALUES
  ('DESEO DIGITAL CRM', 'contacto@deseodigital.com', '+57 321 456 7890', 'https://deseodigital.com', 'https://crmadd.vercel.app/logo.png', '{"primary": "#e91e63", "secondary": "#9c27b0"}', 'Agencia de marketing digital especializada en crecimiento de negocios', 'Village 50, Carrera 27 # 45-67, Villavicencio', 'Villavicencio', 'Colombia', 'https://g.page/deseodigital')
ON CONFLICT (id) DO UPDATE SET
  nombre_agencia = EXCLUDED.nombre_agencia,
  telefono = EXCLUDED.telefono,
  actualizado_en = NOW();

-- 2. CLIENTES (3 clientes reales)
INSERT INTO clientes (nombre, email, telefono, empresa, nicho, origen, dolores, necesidades, intereses, estado, ultima_interaccion, favorito) VALUES
  ('Carlos Rivera', 'carlos@tiendamilagros.com', '+57 300 111 2222', 'Tienda Milagros', 'E-commerce', 'Instagram', 'Pocos clientes online, baja visibilidad en móviles', 'Aumentar ventas en 50%', 'SEO, Conversión', 'Activo', '2025-01-15', true),
  ('María Gómez', 'maria@clinicarenata.com', '+57 311 333 4444', 'Clínica Renata Salud', 'Salud', 'Referido', 'No tienen presencia digital', 'Sitio web + Google Business', 'Diseño web, SEO local', 'Activo', '2025-01-14', true),
  ('Andrés López', 'andres@restaurantelucas.com', '+57 312 555 6666', 'Restaurante El Lucas', 'Hospitality', 'Facebook Ads', 'Reservas bajas, menú no digital', 'Web + Reservas online', 'Diseño web, Ads', 'Activo', '2025-01-13', false)
ON CONFLICT DO NOTHING;

-- 3. EQUIPO (3 colaboradores)
INSERT INTO equipo (nombre, email, rol, especialidad, estado) VALUES
  ('Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia & Gestión', 'Activo'),
  ('Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web', 'Activo'),
  ('Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Diseño gráfico', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 4. SERVICIOS
INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad) VALUES
  ('SEO & Posicionamiento', 'Tecnología', 'Optimización para buscadores y posicionamiento web', 1500000, '3 meses', ARRAY['Research', 'Optimización', 'Reportes'], 'Activo', 95),
  ('Diseño Web Responsive', 'Diseño', 'Creación de sitios web modernos y responsive', 2500000, '4 semanas', ARRAY['Mockup', 'Desarrollo', 'Testing'], 'Activo', 88),
  ('Publicidad en Redes', 'Marketing', 'Campañas de Facebook, Instagram y Google Ads', 1200000, '1 mes', ARRAY['Configuración', 'Monitoreo'], 'Activo', 92)
ON CONFLICT (id) DO NOTHING;

-- 5. PROYECTOS (3 proyectos conectados a clientes)
-- Generamos IDs manualmente para evitar conflictos
WITH new_proyectos AS (
  INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, monto_pagado, estado_pago, metodo_pago, fase_administrativa, creado_en, actualizado_en)
  SELECT 'prj-001', 'SEO & Conversión Tienda Milagros', 'Campaña SEO técnico + landing pages + reportes mensuales', id, nombre, ARRAY['SEO & Posicionamiento', 'Diseño Web'], 'En ejecución', 'Alta', '2024-11-01', '2025-03-31', 65, 3200000, 2100000, 1600000, 'parcial', 'transferencia', 'operacion', '2024-11-01', '2025-01-15'
  FROM clientes WHERE nombre = 'Carlos Rivera' LIMIT 1
  ON CONFLICT (id) DO NOTHING
  RETURNING *
)
INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, monto_pagado, estado_pago, metodo_pago, fase_administrativa, creado_en, actualizado_en)
SELECT 'prj-002', 'Sitio Web Clínica Renata', 'Diseño institucional + blog médico', id, nombre, ARRAY['Diseño Web Responsive'], 'Completado', 'Media', '2024-12-01', '2024-12-28', 100, 2500000, 2500000, 2500000, 'pagado', 'nequi', 'capacitacion', '2024-12-01', '2024-12-28'
FROM clientes WHERE nombre = 'María Gómez' LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 6. OPORTUNIDADES DE VENTA
INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, servicios_interes, fecha_cierre_esperada, etapa, probabilidad, estado) VALUES
  ('Contrato SEO Tienda Milagros', 1, 'Carlos Rivera', 3200000, ARRAY['SEO & Posicionamiento', 'Diseño Web'], '2024-03-31', 'Cerrada', 100, 'Cerrada')
ON CONFLICT DO NOTHING;

-- 7. TAREAS
INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, cliente_id, proyecto_id) VALUES
  ('Auditoría SEO Tienda Milagros', 'Análisis técnico y auditoría de contenido', '2025-01-10', 'Alta', 'Completada', 'Tarea', 1, 'prj-001'),
  ('Crear blog para Clínica Renata', '5 artículos sobre salud preventiva SEO', '2024-12-20', 'Media', 'Completada', 'Tarea', 2, 'prj-002'),
  ('Diseñar landing page Restaurante', 'Mockup y prototipo interactivo', '2025-01-18', 'Alta', 'En progreso', 'Tarea', 3, 'prj-003'),
  ('Crear campaña Facebook Ads', 'Segmentación y creatividades', '2025-01-20', 'Media', 'Pendiente', 'Llamada', 3, 'prj-003')
ON CONFLICT DO NOTHING;

-- 8. FACTURAS
INSERT INTO facturas (numero_factura, proyecto_id, cliente_id, estado, total, subtotal, iva, fecha_emision, fecha_vencimiento, metodo_pago, notas) VALUES
  ('FAC-001-2025', 'prj-001', 1, 'Pagada', 1600000, 1280000, 320000, '2025-01-10', '2025-02-10', 'transferencia', 'Paga inicial 50% contrato SEO')
ON CONFLICT DO NOTHING;

-- 9. PROMPTS AI PARA PERSONALIZACIÓN
INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template, version, categoria) VALUES
  ('gen-resumen-proyecto', 'generar_resumen_proyecto', 'Eres experto en resumen de proyectos digitales. Resume en 3 renglones.', 'Proyecto: {{nombre}}. Estado: {{estado}}. Progreso: {{progreso}}%.', 1, 'Resumen')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIN DEL SEED
-- Refresca https://crmadd.vercel.app para ver los cambios
-- ============================================================