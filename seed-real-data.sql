-- Seed de datos realistas para CRM DESEO DIGITAL
-- Ejecutar en Supabase SQL Editor o via CLI

-- Configuración de la empresa (actualizar si existe)
INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, logo_url, colores, descripcion, direccion, ciudad, pais, google_business_link) VALUES
  ('DESEO DIGITAL CRM', 'contacto@deseodigital.com', '+57 321 456 7890', 'https://deseodigital.com', 'https://crmadd.vercel.app/logo.png', '{"primary": "#e91e63", "secondary": "#9c27b0"}', 'Agencia de marketing digital especializada en crecimiento de negocios', 'Village 50, Carrera 27 # 45-67, Villavicencio', 'Villavicencio', 'Colombia', 'https://g.page/deseodigital')
ON CONFLICT (id) DO UPDATE SET
  nombre_agencia = EXCLUDED.nombre_agencia,
  email_contacto = EXCLUDED.email_contacto,
  telefono = EXCLUDED.telefono,
  website = EXCLUDED.website,
  logo_url = EXCLUDED.logo_url,
  colores = EXCLUDED.colores,
  descripcion = EXCLUDED.descripcion,
  direccion = EXCLUDED.direccion,
  ciudad = EXCLUDED.ciudad,
  pais = EXCLUDED.pais,
  google_business_link = EXCLUDED.google_business_link;

-- 3 PROYECTOS REALES con clientes asociados
INSERT INTO clientes (nombre, email, telefono, empresa, nicho, origen, dolores, necesidades, intereses, estado, ultima_interaccion, favorito) VALUES
  ('Carlos Rivera', 'carlos@tiendamilagros.com', '+57 300 111 2222', 'Tienda Milagros', 'E-commerce', 'Instagram', 'Pocos clientes online, baja visibilidad en móviles', 'Aumentar ventas en 50% y mejorar posición en Google', 'SEO, Redes sociales, Conversión', 'Activo', '2025-01-15', TRUE),
  ('María Gómez', 'maria@clinicarenata.com', '+57 311 333 4444', 'Clínica Renata Salud', 'Salud', 'Referral', 'No tienen presencia digital, pierden pacientes consultando', 'Sitio web profesional y posicionamiento Google My Business', 'Diseño web, SEO local, Blog médico', 'Activo', '2025-01-14', TRUE),
  ('Andrés López', 'andres@restaurantelucas.com', '+57 312 555 6666', 'Restaurante El Lucas', 'Hospitality', 'Facebook Ads', 'Reservas bajas, menú no digital', 'Página web con menú interactivo y sistema de reservas online', 'Diseño web, Ads, Reservas', 'Activo', '2025-01-13', FALSE);

-- Proyectos conectados a clientes
INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, monto_pagado, estado_pago, metodo_pago, fase_administrativa, creado_en, actualizado_en) VALUES
  ('prj-001', 'SEO & Conversión Tienda Milagros', 'Campaña integral de SEO técnico, contenido y landing pages de productos + reportes mensuales', 1, 'Carlos Rivera', ARRAY['SEO & Posicionamiento', 'Diseño Web Responsive'], 'En ejecución', 'Alta', '2024-11-01', '2025-03-31', 65, 3200000, 2100000, 1600000, 'parcial', 'transferencia', 'operacion', '2024-11-01', '2025-01-15'),
  ('prj-002', 'Sitio Web Clínica Renata', 'Diseño institucional completo + blog médico + formulario de citas', 2, 'María Gómez', ARRAY['Diseño Web Responsive'], 'Completado', 'Media', '2024-12-01', '2024-12-28', 100, 2500000, 2500000, 2500000, 'pagado', 'nequi', 'capacitacion', '2024-12-01', '2024-12-28'),
  ('prj-003', 'Página Web Restaurante Lucas', 'Sitio web responsive + menú digital + sistema de reservas + campaña Facebook/Instagram', 3, 'Andrés López', ARRAY['Diseño Web Responsive', 'Publicidad en Redes'], 'En ejecución', 'Alta', '2025-01-05', '2025-01-30', 40, 3800000, 1520000, 0, 'pendiente', NULL, 'propuesta', '2025-01-05', '2025-01-15');

-- Oportunidades de venta
INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, servicios_interes, fecha_cierre_esperada, etapa, probabilidad, estado) VALUES
  ('Contrato SEO Tienda Milagros', 1, 'Carlos Rivera', 3200000, ARRAY['SEO & Posicionamiento', 'Diseño Web'], '2024-03-31', 'Cerrada', 100, 'Cerrada'),
  ('Desarrollo sitio web Clínica', 2, 'María Gómez', 2500000, ARRAY['Diseño Web Responsive'], '2024-12-28', 'Cerrada', 100, 'Cerrada');

-- Tareas para seguimiento
INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, cliente_id, proyecto_id) VALUES
  ('Auditoría SEO Tienda Milagros', 'Análisis técnico, auditoría de contenido yKeyword research', '2025-01-10', 'Alta', 'Completada', 'Tarea', 1, 'prj-001'),
  ('Crear blog para Clínica Renata', '5 artículos sobre salud preventiva optimizados para SEO', '2024-12-20', 'Media', 'Completada', 'Tarea', 2, 'prj-002'),
  ('Diseñar landing page Restaurante', 'Mockup y prototipo interactivo del sitio web', '2025-01-18', 'Alta', 'En progreso', 'Tarea', 3, 'prj-003'),
  ('Crear campaña Facebook Ads', 'Segmentación, creatividades y configuración de audience', '2025-01-20', 'Media', 'Pendiente', 'Llamada', 3, 'prj-003');

-- Facturas emitidas
INSERT INTO facturas (numero_factura, proyecto_id, cliente_id, estado, total, subtotal, iva, fecha_emision, fecha_vencimiento, metodo_pago, notas) VALUES
  ('FAC-001-2025', 'prj-001', 1, 'Pagada', 1600000, 1280000, 320000, '2025-01-10', '2025-02-10', 'transferencia', 'Pago inicial 50% contrato SEO Tienda Milagros');

-- Equipo de trabajo (admin puede supervisar)
INSERT INTO equipo (nombre, email, rol, especialidad, estado) VALUES
  ('Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia & Gestión de clientes', 'Activo'),
  ('Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web & SEO', 'Activo'),
  ('Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Diseño gráfico & Branding', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- Prompts AI para personalización
INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template, version, categoria) VALUES
  ('gen-resumen-proyecto', 'generar_resumen_proyecto', 'Eres un experto en resumen de proyectos de marketing digital. Resume de forma clara los avances, métricas y próximos pasos.', 'Proyecto: {{nombre}}\nEstado: {{estado}}\nProgreso: {{progreso}}%\nPresupuesto: ${{presupuesto}}\nMonto pagado: ${{monto_pagado}}\nGenera un resumen ejecutivo de 3 renglones.', 1, 'Resumen'),
  ('gen-ovimiento-ganado', 'generar_ovimiento_ganado', 'Eres un experto en finanzas. Calcula los ingresos, costos y margen de utilidad.', 'Proyecto: {{nombre}}\nIngresos: ${{monto_pagado}}\nCostos: ${{costo_actual}}\nCalcula el margen neto.', 1, 'Finanzas');

-- Reglas de negocio AI
INSERT INTO reglas_negocio_ai (categoria, instruccion, actualizado_en) VALUES
  ('facturacion', 'Cuando un proyecto alcance 50% de progreso y tenga pagos pendientes, generar recordatorio automático', NOW()),
  ('clientes', 'Si un cliente tiene estado Inactivo hace más de 30 días, asignar tarea de seguimiento de reactivación', NOW());

-- NOTA: Para ver los cambios, refresca https://crmadd.vercel.app
-- El dashboard mostrará:
-- - 3 Proyectos activos
-- - 4 Clientes (3 activos)
-- - Ventas totales: $4,700,000 (suma de montos pagados)
-- - Pipeline: $3,800,000 (proyecto en ejecución)