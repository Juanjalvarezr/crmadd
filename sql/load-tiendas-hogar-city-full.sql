DELETE FROM public.tareas WHERE proyecto_id = 'PRY-2';

INSERT INTO public.tareas (titulo, descripcion, estado, prioridad, fecha, proyecto_id, cliente_id) VALUES
('Reunión kick-off con Tiendas Hogar City', 'Definir objetivos, alcance y entregables del proyecto', 'Completada', 'Alta', '2026-07-15', 'PRY-2', '41'),
('Investigación de mercado y competencia', 'Analizar 5 competidores directos y 3 indirectos', 'Completada', 'Alta', '2026-07-18', 'PRY-2', '41'),
('Definición de buyer persona', 'Crear 3 perfiles detallados de cliente ideal', 'Completada', 'Alta', '2026-07-22', 'PRY-2', '41'),
('Diseño de identidad visual', 'Logotipo, paleta de colores, tipografía y manual de marca', 'En progreso', 'Alta', '2026-07-29', 'PRY-2', '41'),
('Desarrollo de landing page', 'Landing page responsive con dominio propio y analytics', 'En progreso', 'Alta', '2026-08-05', 'PRY-2', '41'),
('Configuración de hosting y dominio', 'Registrar dominio, configurar DNS, hosting y SSL', 'Pendiente', 'Media', '2026-08-08', 'PRY-2', '41'),
('Integración de WhatsApp Business', 'Configurar número empresarial, chatbot y plantillas', 'Pendiente', 'Media', '2026-08-10', 'PRY-2', '41'),
('Creación de contenido para redes', '30 posts para Instagram y Facebook, guión de 10 reels', 'Pendiente', 'Media', '2026-08-12', 'PRY-2', '41'),
('Desarrollo de catálogo digital', 'Catálogo de productos con búsqueda y filtros', 'Pendiente', 'Media', '2026-08-15', 'PRY-2', '41'),
('Configuración de CRM y automatizaciones', 'Configurar pipeline, etapas y notificaciones', 'Pendiente', 'Baja', '2026-08-18', 'PRY-2', '41'),
('Capacitación en uso del CRM', 'Sesión de 2 horas para el equipo de Tiendas Hogar City', 'Pendiente', 'Baja', '2026-08-20', 'PRY-2', '41'),
('Pruebas de funcionalidad', 'Testing de formularios, pagos y flujos completos', 'Pendiente', 'Media', '2026-08-22', 'PRY-2', '41'),
('Lanzamiento oficial', 'Publicación y activación de campaña inicial', 'Pendiente', 'Alta', '2026-08-25', 'PRY-2', '41'),
('Seguimiento y optimización', 'Revisión de métricas semanales y ajustes', 'Pendiente', 'Baja', '2026-09-01', 'PRY-2', '41'),
('Cierre y entrega de proyecto', 'Documentación final, capacitación y cierre comercial', 'Pendiente', 'Baja', '2026-09-15', 'PRY-2', '41');

UPDATE public.proyectos SET
  nombre = 'Estrategia Contenido 2 meses - Tiendas Hogar City',
  descripcion = 'Proyecto integral de posicionamiento digital y automatización comercial para Tiendas Hogar City.',
  estado = 'en_progreso',
  prioridad = 'alta',
  fase_administrativa = 'Implementacion',
  progreso = 35,
  presupuesto = 8500000,
  costo_actual = 2100000,
  monto_pagado = 2850000,
  fecha_inicio = '2026-07-15',
  fecha_fin = '2026-09-15',
  servicios = ARRAY['estrategia_digital', 'contenido', 'diseno', 'desarrollo', 'crm', 'automatizacion', 'capacitacion'],
  cliente_id = '41'
WHERE id = 'PRY-2';

UPDATE public.proyectos SET
  estrategia = '{"objetivo": "Posicionar a Tiendas Hogar City como referente digital en el sector de hogar y decoración, generando leads cualificados y automatizando el proceso comercial.", "publico_objetivo": "Mujeres y hombres de 25 a 55 años, clase media-alta, interesados en decoración, hogar y lifestyle, residentes en zonas urbanas de Colombia.", "diferenciador": "Experiencia digital híbrida: atención humana WhatsApp + automatizaciones inteligentes + contenido evergreen.", "cronograma": "Semana 1-2: Investigación y definición estratégica. Semana 3-4: Diseño y contenido. Semana 5-6: Desarrollo y CRM. Semana 7-8: Lanzamiento y optimización."}'::jsonb
WHERE id = 'PRY-2';

UPDATE public.proyectos SET
  canales = '{"redes": true, "ads": true, "email": true, "seo": true, "whatsapp": true}'::jsonb
WHERE id = 'PRY-2';

UPDATE public.proyectos SET
  cronograma = '[{"titulo": "Kick-off y definición estratégica", "fecha": "2026-07-15", "descripcion": "Reunión inicial, objetivos y presupuesto", "estado": "Completado"}, {"titulo": "Diseño de identidad visual", "fecha": "2026-07-22", "descripcion": "Logotipo, paleta, tipografía y manual de marca", "estado": "Completado"}, {"titulo": "Desarrollo de landing page", "fecha": "2026-08-05", "descripcion": "Landing responsive con formularios y pagos", "estado": "En progreso"}, {"titulo": "Integración WhatsApp Business", "fecha": "2026-08-10", "descripcion": "Chatbot, plantillas y flujos de atención", "estado": "Pendiente"}, {"titulo": "Contenido para redes sociales", "fecha": "2026-08-12", "descripcion": "30 posts y 10 reels para Instagram y Facebook", "estado": "Pendiente"}, {"titulo": "Implementación CRM y automatizaciones", "fecha": "2026-08-18", "descripcion": "Pipeline, etapas, notificaciones y reportes", "estado": "Pendiente"}, {"titulo": "Lanzamiento y campaña inicial", "fecha": "2026-08-25", "descripcion": "Publicación, métricas y ajustes iniciales", "estado": "Pendiente"}]'::jsonb
WHERE id = 'PRY-2';

UPDATE public.proyectos SET
  recursos = '[{"id": 1, "nombre": "Manual de marca", "url": "https://crmadd.vercel.app/documentos/manual-marca-tiendas.pdf"}, {"id": 2, "nombre": "Guía de estilo", "url": "https://crmadd.vercel.app/documentos/guia-estilo.pdf"}, {"id": 3, "nombre": "Contrato de servicios", "url": "https://crmadd.vercel.app/documentos/contrato-tiendas-hogar-city.pdf"}]'::jsonb,
  facturacion_detalle = '{"estado": "en_progreso", "cuotas": [{"monto": 2850000, "fecha": "2026-07-15", "pagada": true}, {"monto": 2850000, "fecha": "2026-08-15", "pagada": false}, {"monto": 2800000, "fecha": "2026-09-15", "pagada": false}]}'::jsonb,
  contrato_url = 'https://crmadd.vercel.app/documentos/contrato-tiendas-hogar-city.pdf'
WHERE id = 'PRY-2';
