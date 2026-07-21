-- Loop 3: seed real y RLS por proyecto
-- Ejecutar con: supabase db query --linked -f sql/loop3-seed-rls.sql

BEGIN;

-- 1. Estrategia y canales para PRY-2
UPDATE public.proyectos
SET
  estrategia = jsonb_build_object(
    'objetivo', 'Posicionar Tiendas Hogar City como referente de hogar en Paraguay y Colombia',
    'publico_objetivo', 'Mujeres 25-45, clase media-alta, interesadas en decoración y tecnología para el hogar',
    'diferenciador', 'Contenido práctico + experiencia local + atención personalizada',
    'cronograma', 'Mes 1: lanzamiento y contenidos básicos. Mes 2: escalado con ads y automatizaciones.'
  ),
  canales = jsonb_build_object(
    'redes', true,
    'ads', true,
    'email', true,
    'seo', true,
    'whatsapp', true
  ),
  cronograma = jsonb_build_array(
    jsonb_build_object('fecha', '2026-08-05', 'titulo', 'Kick-off y alineación', 'estado', 'Completado'),
    jsonb_build_object('fecha', '2026-08-12', 'titulo', 'Contenidos iniciales', 'estado', 'En progreso'),
    jsonb_build_object('fecha', '2026-08-19', 'titulo', 'Campaña ads', 'estado', 'Pendiente'),
    jsonb_build_object('fecha', '2026-08-26', 'titulo', 'Informe intermedio', 'estado', 'Pendiente'),
    jsonb_build_object('fecha', '2026-09-02', 'titulo', 'Escalado y cierre', 'estado', 'Pendiente')
  ),
  facturacion_detalle = jsonb_build_object(
    'monto_total', 15000000,
    'monto_pagado', 4500000,
    'estado', 'en_progreso',
    'cuotas', jsonb_build_array(
      jsonb_build_object('monto', 5000000, 'fecha', '2026-08-01', 'pagada', true),
      jsonb_build_object('monto', 5000000, 'fecha', '2026-09-01', 'pagada', false),
      jsonb_build_object('monto', 5000000, 'fecha', '2026-10-01', 'pagada', false)
    )
  )
WHERE id = 'PRY-2';

-- 2. Tareas para PRY-2
INSERT INTO public.tareas (proyecto_id, titulo, descripcion, estado, prioridad, fecha, tipo, responsable_id)
VALUES
  ('PRY-2', 'Reunión kick-off inmobiliaria', 'Alineación de objetivos, públicos y entregables', 'Completada', 'Alta', '2026-08-05', 'reunion', NULL),
  ('PRY-2', 'Diseño de contenido base', 'Crear 8 piezas base para redes y web', 'En progreso', 'Alta', '2026-08-12', 'contenido', NULL),
  ('PRY-2', 'Configuración de campaña ads', 'Pixel, eventos y primera campaña', 'Pendiente', 'Media', '2026-08-19', 'tecnico', NULL),
  ('PRY-2', 'Email de bienvenida', 'Plantilla y secuencia inicial', 'Pendiente', 'Media', '2026-08-15', 'email', NULL),
  ('PRY-2', 'Informe intermedio', 'Métricas y recomendaciones', 'Pendiente', 'Alta', '2026-08-26', 'reporte', NULL)
ON CONFLICT DO NOTHING;

-- 3. Contratos para PRY-2
INSERT INTO public.contratos (proyecto_id, titulo, tipo, estado, fecha_inicio, fecha_fin, valor, cliente_id, contenido)
VALUES
  ('PRY-2', 'Contrato principal Hogar City', 'prestacion_servicios', 'activo', '2026-08-01', '2026-10-31', 15000000, 41, 'Contrato de prestación de servicios entre DESEO DIGITAL y Tiendas Hogar City.')
ON CONFLICT DO NOTHING;

-- 4. Facturas para PRY-2
INSERT INTO public.facturas (proyecto_id, numero, tipo, total, estado, fecha_emision, cliente_id, concepto, estado_pago, subtotal, iva, moneda, fecha_vencimiento, notas)
VALUES
  ('PRY-2', 'FAC-001', 'servicio', 5000000, 'pendiente', '2026-08-01', 41, 'Servicio inicial Hogar City', 'pendiente', 5000000, 0, 'COP', '2026-08-15', 'Primera factura del proyecto'),
  ('PRY-2', 'FAC-002', 'servicio', 5000000, 'pendiente', '2026-09-01', 41, 'Segunda cuota Hogar City', 'pendiente', 5000000, 0, 'COP', '2026-09-15', 'Segunda factura del proyecto'),
  ('PRY-2', 'FAC-003', 'servicio', 5000000, 'pendiente', '2026-10-01', 41, 'Tercera cuota Hogar City', 'pendiente', 5000000, 0, 'COP', '2026-10-15', 'Tercera factura del proyecto')
ON CONFLICT DO NOTHING;

-- 5. Documentos para PRY-2
INSERT INTO public.documentos (entidad_id, entidad_tipo, titulo, url, tipo, usuario, creado_en)
VALUES
  ('PRY-2', 'proyecto', 'Onboarding Hogar City', 'https://crmadd.vercel.app/docs/onboarding.pdf', 'pdf', 'Juan José', now()),
  ('PRY-2', 'proyecto', 'Brief creativo', 'https://crmadd.vercel.app/docs/brief.pdf', 'pdf', 'Juan José', now()),
  ('PRY-2', 'proyecto', 'Lineamientos de marca', 'https://crmadd.vercel.app/docs/lineamientos.pdf', 'pdf', 'Juan José', now())
ON CONFLICT DO NOTHING;

-- 6. RLS: clientes accesibles para usuarios autenticados
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_read_own" ON public.clientes;
CREATE POLICY "clientes_read_authenticated" ON public.clientes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 7. RLS: proyectos accesibles para usuarios autenticados
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proyectos_read_project" ON public.proyectos;
CREATE POLICY "proyectos_read_authenticated" ON public.proyectos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. RLS: tareas, facturas, contratos y documentos por proyecto para usuarios autenticados
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tareas_by_project" ON public.tareas;
DROP POLICY IF EXISTS "facturas_by_project" ON public.facturas;
DROP POLICY IF EXISTS "contratos_by_project" ON public.contratos;
DROP POLICY IF EXISTS "documentos_by_project" ON public.documentos;

CREATE POLICY "tareas_read_authenticated" ON public.tareas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "facturas_read_authenticated" ON public.facturas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "contratos_read_authenticated" ON public.contratos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "documentos_read_authenticated" ON public.documentos
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMIT;
