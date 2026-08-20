-- DESEO DIGITAL - Seed CRM alineado al schema real confirmado
-- Ejecutar en SQL Editor de Supabase.

-- Equipo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipo') THEN
    INSERT INTO equipo (nombre, email, rol, especialidad, estado, created_at)
    SELECT 'Juan José Álvarez', 'juan@deseodigital.com', 'Admin', 'Estrategia', 'Activo', CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM equipo WHERE email = 'juan@deseodigital.com');

    INSERT INTO equipo (nombre, email, rol, especialidad, estado, created_at)
    SELECT 'Jessica López', 'jessica@deseodigital.com', 'Técnico', 'Desarrollo Web', 'Activo', CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM equipo WHERE email = 'jessica@deseodigital.com');

    INSERT INTO equipo (nombre, email, rol, especialidad, estado, created_at)
    SELECT 'Pedro Ramírez', 'pedro@deseodigital.com', 'Creativo', 'Branding', 'Activo', CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM equipo WHERE email = 'pedro@deseodigital.com');
  END IF;
END $$;

-- Cliente base
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
    INSERT INTO clientes (nombre, email, telefono, empresa, nicho, estado, favorito, created_at)
    SELECT 'Juan Jose Alvarez', 'juanjosealvarez@gmail.com', '320 369 8476', 'DESEO DIGITAL', 'Tecnología', 'Activo', true, CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'juanjosealvarez@gmail.com');
  END IF;
END $$;

-- Configuración empresa
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracion_empresa') THEN
    INSERT INTO configuracion_empresa (nombre_agencia, email_contacto, telefono, website, descripcion, direccion, ciudad, pais, actualizado_en)
    SELECT 'DESEO DIGITAL', 'contacto@deseodigital.com', '320 369 8476', 'https://deseodigital.com', 'Agencia especializada en Marketing Digital y SEO', 'Calle 10 #20-30', 'Medellín', 'Colombia', CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM configuracion_empresa LIMIT 1);
  END IF;
END $$;

-- Servicios
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servicios') THEN
    INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
    SELECT 'Diseño Web Profesional', 'Desarrollo', 'Landing page o sitio corporativo', 2500000, '2 semanas', ARRAY['Diseño responsive','SEO básico','Hosting 1 año'], 'Activo', 5, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'Diseño Web Profesional');

    INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
    SELECT 'Desarrollo Full Stack', 'Desarrollo', 'App web o móvil completa', 8500000, '1 mes', ARRAY['Frontend','Backend','Base de datos','Despliegue'], 'Activo', 4, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'Desarrollo Full Stack');

    INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad, created_at)
    SELECT 'SEO Optimization', 'Marketing', 'Auditoría y optimización SEO', 1200000, '1 semana', ARRAY['Auditoría','Keywords','Reporte mensual'], 'Activo', 3, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'SEO Optimization');
  END IF;
END $$;

-- Reglas AI
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reglas_negocio_ai') THEN
    INSERT INTO reglas_negocio_ai (categoria, instruccion)
    SELECT 'ventas', 'Siempre mencionar el anticipo del 50% antes de empezar proyecto'
    WHERE NOT EXISTS (SELECT 1 FROM reglas_negocio_ai WHERE categoria = 'ventas');

    INSERT INTO reglas_negocio_ai (categoria, instruccion)
    SELECT 'operaciones', 'Validar disponibilidad de equipo antes de asignar tarea'
    WHERE NOT EXISTS (SELECT 1 FROM reglas_negocio_ai WHERE categoria = 'operaciones');

    INSERT INTO reglas_negocio_ai (categoria, instruccion)
    SELECT 'branding', 'Usar solo la paleta de colores oficial de la agencia'
    WHERE NOT EXISTS (SELECT 1 FROM reglas_negocio_ai WHERE categoria = 'branding');
  END IF;
END $$;

-- Prompts AI
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompts_ai')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts_ai' AND column_name = 'id') THEN
    INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template)
    SELECT 'prompt_001', 'director_estrategico', 'Eres el Director Estratégico Senior de DESEO DIGITAL.', 'Redacta una propuesta persuasiva para {{clienteNombre}}. Servicios: {{servicios}}. Enfócate en el ROI y el anticipo del 50%.'
    WHERE NOT EXISTS (SELECT 1 FROM prompts_ai WHERE id = 'prompt_001');

    INSERT INTO prompts_ai (id, slug, system_prompt, user_prompt_template)
    SELECT 'prompt_002', 'cfo_agencia', 'Eres el CFO de DESEO DIGITAL.', 'Analiza el flujo de caja. Anticipos recaudados: {{montoPagado}}. Presupuesto total: {{presupuesto}}.'
    WHERE NOT EXISTS (SELECT 1 FROM prompts_ai WHERE id = 'prompt_002');
  END IF;
END $$;

-- Conocimiento
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conocimiento_agencia') THEN
    INSERT INTO conocimiento_agencia (titulo, contenido, categoria)
    SELECT 'Onboarding cliente', 'Pasos: contrato, acceso a Drive, calendar, chat IA.', 'operaciones'
    WHERE NOT EXISTS (SELECT 1 FROM conocimiento_agencia WHERE titulo = 'Onboarding cliente');
  END IF;
END $$;

-- Oportunidades
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oportunidades') THEN
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
  END IF;
END $$;

-- Proyecto
DO $$
DECLARE
  v_proyecto_id uuid;
  v_proyecto_id_text text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proyectos') THEN
    SELECT gen_random_uuid() INTO v_proyecto_id;
    v_proyecto_id_text := CAST(v_proyecto_id AS text);
    INSERT INTO proyectos (id, nombre, descripcion, cliente_id, cliente_nombre, servicios, estado, prioridad, fecha_inicio, fecha_fin, progreso, presupuesto, costo_actual, estado_pago, fase_administrativa)
    SELECT v_proyecto_id, 'Agencia Deseo Digital', 'Proyecto interno CRM', c.id, 'DESEO DIGITAL', ARRAY['Diseño Web Profesional'], 'en_progreso', 'alta', '2026-06-01', '2026-12-31', 30, 15000000, 4500000, 'parcial', 'operacion'
    FROM clientes c
    WHERE c.email = 'juanjosealvarez@gmail.com'
      AND NOT EXISTS (SELECT 1 FROM proyectos WHERE nombre = 'Agencia Deseo Digital');

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tareas') THEN
      INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
      SELECT 'Definir alcance CRM', 'Reunir requisitos y cierre de propuesta', CURRENT_DATE + 2, 'Alta', 'Pendiente', 'Tarea', v_proyecto_id, c.id, e.id
      FROM clientes c
      JOIN (SELECT id FROM equipo WHERE email = 'juan@deseodigital.com') e ON true
      WHERE c.email = 'juanjosealvarez@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM tareas WHERE titulo = 'Definir alcance CRM' AND proyecto_id = v_proyecto_id_text);

      INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
      SELECT 'Diseño UI/UX', 'Prototipos y pruebas de contraste', CURRENT_DATE + 5, 'Media', 'En progreso', 'Tarea', v_proyecto_id, c.id, e.id
      FROM clientes c
      JOIN (SELECT id FROM equipo WHERE email = 'jessica@deseodigital.com') e ON true
      WHERE c.email = 'juanjosealvarez@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM tareas WHERE titulo = 'Diseño UI/UX' AND proyecto_id = v_proyecto_id_text);

      INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado, tipo, proyecto_id, cliente_id, responsable_id)
      SELECT 'Entrega cliente', 'Demo funcional y capacitación', CURRENT_DATE + 10, 'Alta', 'Pendiente', 'Cita', v_proyecto_id, c.id, e.id
      FROM clientes c
      JOIN (SELECT id FROM equipo WHERE email = 'juan@deseodigital.com') e ON true
      WHERE c.email = 'juanjosealvarez@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM tareas WHERE titulo = 'Entrega cliente' AND proyecto_id = v_proyecto_id_text);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facturas') THEN
      INSERT INTO facturas (proyecto_id, cliente_id, estado, total, subtotal, iva, numero, tipo, moneda, estado_pago, fecha_emision, fecha_vencimiento)
      SELECT v_proyecto_id_text, c.id, 'Enviada', 15000000, 12500000, 2500000, 'FAC-001', 'factura', 'COP', 'Pendiente', CURRENT_DATE - 10, CURRENT_DATE + 20
      FROM clientes c
      WHERE c.email = 'juanjosealvarez@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM facturas WHERE numero = 'FAC-001');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') THEN
      INSERT INTO contratos (cliente_id, proyecto_id, tipo, titulo, contenido, estado, valor, fecha_inicio, fecha_fin)
      SELECT c.id, v_proyecto_id_text, 'prestacion_servicios', 'Contrato Agencia Deseo Digital', 'Contrato de prestación de servicios', 'activo', 15000000, CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days'
      FROM clientes c
      WHERE c.email = 'juanjosealvarez@gmail.com';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transacciones') THEN
      INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, categoria, moneda, forma_pago, fecha)
      SELECT v_proyecto_id_text, c.id, 'ingreso', 4500000, 'ingreso', 'COP', 'transferencia', CURRENT_DATE - 8
      FROM clientes c
      WHERE c.email = 'juanjosealvarez@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM transacciones WHERE tipo = 'ingreso' AND categoria = 'ingreso' AND proyecto_id = v_proyecto_id_text);

      INSERT INTO transacciones (proyecto_id, cliente_id, tipo, monto, categoria, moneda, forma_pago, fecha)
      SELECT v_proyecto_id_text, c.id, 'egreso', 1200000, 'egreso', 'COP', 'transferencia', CURRENT_DATE - 5
      FROM clientes c
      WHERE c.email = 'juanjosealvarez@gmail.com'
        AND NOT EXISTS (SELECT 1 FROM transacciones WHERE tipo = 'egreso' AND categoria = 'egreso' AND proyecto_id = v_proyecto_id_text);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagos') THEN
      INSERT INTO pagos (factura_id, monto, metodo_pago, referencia, fecha_pago)
      SELECT 1, 4500000, 'transferencia', 'REF-001', CURRENT_DATE - 8
      WHERE EXISTS (SELECT 1 FROM facturas WHERE id = 1);
    END IF;
  END IF;
END $$;

-- Campanas email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campanas_email') THEN
    INSERT INTO campanas_email (id, nombre, asunto, estado, destinatarios, created_at)
    SELECT 'camp_001', 'Bienvenida DESEO', 'Bienvenido a DESEO DIGITAL', 'borrador', ARRAY['juanjosealvarez@gmail.com'], CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM campanas_email WHERE id = 'camp_001');
  END IF;
END $$;

-- Plantillas email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plantillas_email') THEN
    INSERT INTO plantillas_email (id, nombre, asunto, contenido, categoria)
    SELECT 'plantilla_001', 'Propuesta estándar', 'Propuesta {{cliente}}', 'Hola {{cliente}}, ...', 'ventas'
    WHERE NOT EXISTS (SELECT 1 FROM plantillas_email WHERE id = 'plantilla_001');
  END IF;
END $$;

-- Interacción inicial
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interacciones') THEN
    INSERT INTO interacciones (cliente_id, tipo, asunto, contenido, usuario)
    SELECT c.id, 'WhatsApp', 'Consulta inicial', 'Interés por servicios digitales', 'Asistente IA'
    FROM clientes c
    WHERE c.email = 'juanjosealvarez@gmail.com';
  END IF;
END $$;
