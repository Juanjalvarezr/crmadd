-- Tiendas Hogar City - id real: PRY-2
UPDATE public.proyectos
SET
  estrategia = '{"objetivo": "Posicionar a Tiendas Hogar City como referente en el hogar digital con identidad moderna, contenido visual y automatizaciones que incrementen ventas online.", "publico_objetivo": "Mujeres y hombres entre 28 y 45 años interesados en decoración, organización del hogar y productos funcionales.", "diferenciador": "Fotografía estilizada, historias coherentes y respuesta ágil por WhatsApp para cerrar ventas.", "cronograma": "Semana 1: onboarding y acceso CRM. Semana 2: identidad visual y calendario editorial. Semana 3-8: producción de contenido, pauta y reportes quincenales."}',
  canales = '{"redes": true, "ads": true, "email": true, "seo": false}',
  facturacion_detalle = '{"monto_total": 1000000, "monto_pagado": 300000, "estado": "en_progreso", "cuotas": [{"monto": 300000, "fecha": "2026-07-20", "pagada": true}, {"monto": 350000, "fecha": "2026-08-20", "pagada": false}, {"monto": 350000, "fecha": "2026-09-12", "pagada": false}]}',
  progreso = 35,
  fase_administrativa = 'operacion',
  recursos = '[
    {"id": "r1", "nombre": "Identidad visual v1", "url": "https://supabase.co/storage/v1/object/public/crm-documents/tiendas/identidad.zip"},
    {"id": "r2", "nombre": "Calendario editorial julio", "url": "https://supabase.co/storage/v1/object/public/crm-documents/tiendas/calendario-julio.pdf"},
    {"id": "r3", "nombre": "Brand guidelines PDF", "url": "https://supabase.co/storage/v1/object/public/crm-documents/tiendas/brand-guidelines.pdf"}
  ]',
  contrato_url = 'https://supabase.co/storage/v1/object/public/crm-documents/tiendas/contrato-servicio.pdf',
  brief = 'Brief aprobado: marca Tiendas Hogar City, foco en contenido para hogar, respuesta en <24h y métricas de conversión.'
WHERE id = 'PRY-2';
