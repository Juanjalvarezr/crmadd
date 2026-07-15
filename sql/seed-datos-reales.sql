-- CRM DESEO DIGITAL - Seed seguro
-- Paso 1: Clientes
INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado)
SELECT 'María Fernanda López', 'maria@tiendanova.com', '300 111 2233', 'Tienda Nova', 'E-commerce', 'Referido', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'maria@tiendanova.com');

INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado)
SELECT 'Carlos Ramírez', 'carlos@inmobiliaria.com', '311 222 3344', 'Inmobiliaria Carlos Ramírez', 'Inmobiliaria', 'Web', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'carlos@inmobiliaria.com');

INSERT INTO public.clientes (nombre, email, telefono, empresa, nicho, origen, estado)
SELECT 'Laura Martínez', 'laura@restaurantesabor.com', '312 333 4455', 'Restaurante Sabor', 'Gastronomía', 'Instagram', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM public.clientes WHERE email = 'laura@restaurantesabor.com');

-- Paso 2: Proyectos
INSERT INTO public.proyectos (nombre, descripcion, cliente_id, cliente_nombre, presupuesto, costo_actual, estado, prioridad, fecha_inicio, fecha_fin, progreso)
SELECT 'E-commerce Tienda Nova', 'Desarrollo de tienda en línea', 4, 'María Fernanda López', 8500000, 4200000, 'en_progreso', 'Alta', '2025-01-15', '2025-03-30', 65
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE nombre = 'E-commerce Tienda Nova');

INSERT INTO public.proyectos (nombre, descripcion, cliente_id, cliente_nombre, presupuesto, costo_actual, estado, prioridad, fecha_inicio, fecha_fin, progreso)
SELECT 'Página Web Inmobiliaria', 'Sitio web corporativo', 5, 'Carlos Ramírez', 6200000, 3100000, 'en_progreso', 'Media', '2025-02-01', '2025-04-15', 50
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE nombre = 'Página Web Inmobiliaria');

INSERT INTO public.proyectos (nombre, descripcion, cliente_id, cliente_nombre, presupuesto, costo_actual, estado, prioridad, fecha_inicio, fecha_fin, progreso)
SELECT 'Branding Restaurante Sabor', 'Identidad visual y social media', 6, 'Laura Martínez', 4500000, 1800000, 'planificacion', 'Alta', '2025-03-01', '2025-05-30', 20
WHERE NOT EXISTS (SELECT 1 FROM public.proyectos WHERE nombre = 'Branding Restaurante Sabor');

-- Paso 3: Tareas
INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Diseño mockups e-commerce', 'Crear mockups', '2025-01-20', 'Alta', 'En progreso', 'Tarea', (SELECT id FROM public.proyectos WHERE nombre = 'E-commerce Tienda Nova'), 4
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE titulo = 'Diseño mockups e-commerce');

INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Configurar pasarela de pagos', 'Integrar pagos', '2025-02-05', 'Alta', 'Pendiente', 'Tarea', (SELECT id FROM public.proyectos WHERE nombre = 'E-commerce Tienda Nova'), 4
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE titulo = 'Configurar pasarela de pagos');

INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Reunión kick-off inmobiliaria', 'Presentación', '2025-02-10', 'Media', 'Pendiente', 'Cita', (SELECT id FROM public.proyectos WHERE nombre = 'Página Web Inmobiliaria'), 5
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE titulo = 'Reunión kick-off inmobiliaria');

INSERT INTO public.tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id)
SELECT 'Diseño de logotipo y paleta', 'Propuesta branding', '2025-03-10', 'Alta', 'Pendiente', 'Tarea', (SELECT id FROM public.proyectos WHERE nombre = 'Branding Restaurante Sabor'), 6
WHERE NOT EXISTS (SELECT 1 FROM public.tareas WHERE titulo = 'Diseño de logotipo y paleta');

-- Paso 4: Oportunidades
INSERT INTO public.oportunidades (titulo, descripcion, valor, etapa, probabilidad, estado, cliente_id, cliente_nombre)
SELECT 'Renovación anual Tienda Nova', 'Hosting', 2400000, 'Propuesta', 70, 'Abierta', 4, 'María Fernanda López'
WHERE NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE titulo = 'Renovación anual Tienda Nova');

INSERT INTO public.oportunidades (titulo, descripcion, valor, etapa, probabilidad, estado, cliente_id, cliente_nombre)
SELECT 'App móvil inmobiliaria', 'Desarrollo app', 12500000, 'Prospección', 40, 'Abierta', 5, 'Carlos Ramírez'
WHERE NOT EXISTS (SELECT 1 FROM public.oportunidades WHERE titulo = 'App móvil inmobiliaria');

-- Paso 5: Transacciones (categoria ajustada al constraint real)
INSERT INTO public.transacciones (monto, tipo, categoria, fecha, proyecto_id)
SELECT 4250000, 'ingreso', 'Pago', '2025-01-30', (SELECT id FROM public.proyectos WHERE nombre = 'E-commerce Tienda Nova')
WHERE NOT EXISTS (SELECT 1 FROM public.transacciones WHERE monto = 4250000);

INSERT INTO public.transacciones (monto, tipo, categoria, fecha, proyecto_id)
SELECT 3100000, 'ingreso', 'Pago', '2025-02-15', (SELECT id FROM public.proyectos WHERE nombre = 'Página Web Inmobiliaria')
WHERE NOT EXISTS (SELECT 1 FROM public.transacciones WHERE monto = 3100000);

INSERT INTO public.transacciones (monto, tipo, categoria, fecha)
SELECT 150000, 'egreso', 'Herramientas', '2025-01-10'
WHERE NOT EXISTS (SELECT 1 FROM public.transacciones WHERE monto = 150000 AND tipo = 'egreso');
