// Seed script para CRM DESEO DIGITAL - Genera datos realistas de prueba
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Datos de empresa
const empresa = {
  nombre_agencia: 'DESEO DIGITAL CRM',
  email_contacto: 'contacto@deseodigital.com',
  telefono: '+57 321 456 7890',
  website: 'https://deseodigital.com',
  logo_url: 'https://crmadd.vercel.app/logo.png',
  descripcion: 'Agencia de marketing digital especializada en crecimiento de negocios',
  direccion: 'Village 50, Carrera 27 # 45-67, Villavicencio',
  ciudad: 'Villavicencio',
  pais: 'Colombia',
  colores: { primary: '#e91e63', secondary: '#9c27b0' },
  google_business_link: 'https://g.page/deseodigital'
};

// Servicios
const servicios = [
  { nombre: 'SEO & Posicionamiento', categoria: 'Tecnología', descripcion: 'Optimización para buscadores y posicionamiento web', precio_base: 1500000, duracion: '3 meses', incluye: ['Research', 'Optimización on-page', 'Reportes mensuales'], estado: 'Activo', popularidad: 95 },
  { nombre: 'Diseño Web Responsive', categoria: 'Diseño', descripcion: 'Creación de sitios web modernos y responsive', precio_base: 2500000, duracion: '4 semanas', incluye: ['Mockup', 'Desarrollo', 'Testing', 'Entrega'], estado: 'Activo', popularidad: 88 },
  { nombre: 'Publicidad en Redes', categoria: 'Marketing', descripcion: 'Campañas de Facebook, Instagram y Google Ads', precio_base: 1200000, duracion: '1 mes', incluye: ['Configuración', 'Segmentación', 'Monitoreo', 'Reportes'], estado: 'Activo', popularidad: 92 }
];

// Clientes (generando IDs autoincrementales)
const clientes = [
  {
    nombre: 'Carlos Rivera',
    email: 'carlos@tiendamilagros.com',
    telefono: '+57 300 111 2222',
    empresa: 'Tienda Milagros',
    nicho: 'E-commerce',
    origen: 'Instagram',
    dolores: 'Pocos clientes online, baja visibilidad en móviles',
    necesidades: 'Aumentar ventas en 50% y mejorar posición en Google',
    estado: 'Activo',
    ultima_interaccion: '2025-01-15',
    favorito: true
  },
  {
    nombre: 'María Gómez',
    email: 'maria@clinicarenata.com',
    telefono: '+57 311 333 4444',
    empresa: 'Clínica Renata Salud',
    nicho: 'Salud',
    origen: 'Referrals',
    dolores: 'No tienen presencia digital, pierden pacientes',
    necesidades: 'Sitio web profesional y posicionamiento Google My Business',
    estado: 'Activo',
    ultima_interaccion: '2025-01-14',
    favorito: true
  },
  {
    nombre: 'Andrés López',
    email: 'andres@restaurantelucas.com',
    telefono: '+57 312 555 6666',
    empresa: 'Restaurante El Lucas',
    nicho: 'Hospitality',
    origen: 'Facebook Ads',
    dolores: 'Reservas bajas, no saben qué comer',
    necesidades: 'Página web con menú digital y sistema de reservas',
    estado: 'Activo',
    ultima_interaccion: '2025-01-13',
    favorito: false
  }
];

// Proyectos
const proyectos = [
  {
    nombre: 'SEO & Conversión Tienda Milagros',
    descripcion: 'Campaña integral de SEO técnico y estratégico + landing page de productos',
    cliente_id: 1,
    cliente_nombre: 'Carlos Rivera',
    servicios: ['SEO & Posicionamiento', 'Diseño Web Responsive'],
    estado: 'En ejecución',
    prioridad: 'Alta',
    fecha_inicio: '2024-11-01',
    fecha_fin: '2025-03-31',
    progreso: 65,
    presupuesto: 3200000,
    costo_actual: 2100000,
    monto_pagado: 1600000,
    estado_pago: 'parcial',
    metodo_pago: 'transferencia',
    fase_administrativa: 'operacion',
    creado_en: '2024-11-01',
    actualizado_en: '2025-01-15'
  },
  {
    nombre: 'Sitio Web Clínica Renata',
    descripcion: 'Diseño y desarrollo de sitio web institucional con blog médico',
    cliente_id: 2,
    cliente_nombre: 'María Gómez',
    servicios: ['Diseño Web Responsive'],
    estado: 'Completado',
    prioridad: 'Media',
    fecha_inicio: '2024-12-01',
    fecha_fin: '2024-12-28',
    progreso: 100,
    presupuesto: 2500000,
    costo_actual: 2500000,
    monto_pagado: 2500000,
    estado_pago: 'pagado',
    metodo_pago: 'nequi',
    fase_administrativa: 'capacitacion',
    creado_en: '2024-12-01',
    actualizado_en: '2024-12-28'
  },
  {
    nombre: 'Página Web Restaurante Lucas',
    descripcion: 'Sitio web con menú interactivo y sistema de reservas Online',
    cliente_id: 3,
    cliente_nombre: 'Andrés López',
    servicios: ['Diseño Web Responsive', 'Publicidad en Redes'],
    estado: 'En ejecución',
    prioridad: 'Alta',
    fecha_inicio: '2025-01-05',
    fecha_fin: '2025-01-30',
    progreso: 40,
    presupuesto: 3800000,
    costo_actual: 1520000,
    monto_pagado: 0,
    estado_pago: 'pendiente',
    fase_administrativa: 'propuesta',
    creado_en: '2025-01-05',
    actualizado_en: '2025-01-15'
  }
];

// Tareas
const tareas = [
  { titulo: 'Auditoría SEO Tienda Milagros', descripcion: 'Análisis técnico y auditoría de contenido', fecha: '2025-01-10', prioridad: 'Alta', estado: 'Completada', tipo: 'Tarea', cliente_id: 1, proyecto_id: '1' },
  { titulo: 'Crear blog para Clínica Renata', descripcion: '5 artículos sobre salud preventiva', fecha: '2024-12-20', prioridad: 'Media', estado: 'Completada', tipo: 'Tarea', cliente_id: 2, proyecto_id: '2' },
  { titulo: 'Diseñar landing page Restaurante', descripcion: 'Mockup y prototipo interactivo', fecha: '2025-01-18', prioridad: 'Alta', estado: 'En progreso', tipo: 'Tarea', cliente_id: 3, proyecto_id: '3' },
  { titulo: 'Crear campaña Facebook Ads', descripcion: 'Segmentación y creatividades para Restaurante Lucas', fecha: '2025-01-20', prioridad: 'Media', estado: 'Pendiente', tipo: 'Llamada', cliente_id: 3, proyecto_id: '3' }
];

// Oportunidades de venta
const oportunidades = [
  { nombre: 'Contrato SEO Tienda Milagros', cliente_id: 1, valor: 3200000, servicios_interes: ['SEO & Posicionamiento'], etapa: 'Cerrada', probabilidad: 100, estado: 'Cerrada', fecha_cierre_esperada: '2024-03-31' },
  { nombre: 'Desarrollo sitio web Clínica', cliente_id: 2, valor: 2500000, servicios_interes: ['Diseño Web Responsive'], etapa: 'Cerrada', probabilidad: 100, estado: 'Cerrada', fecha_cierre_esperada: '2024-12-28' }
];

// Facturas
const facturas = [
  { numero_factura: 'FAC-001-2025', proyecto_id: '1', cliente_id: 1, estado: 'Pagada', total: 1600000, iva: 320000, fecha_emision: '2025-01-10', fecha_vencimiento: '2025-02-10', metodo_pago: 'transferencia' }
];

async function seed() {
  console.log('Seeding CRM data...');
  
  try {
    // 1. Configuración empresa
    const { error: configError } = await supabase
      .from('configuracion_empresa')
      .upsert([empresa], { onConflict: 'id' });
    console.log('Configuración empresa:', configError ? 'Error: ' + configError.message : '✓');

    // 2. Servicios
    const { error: serviciosError } = await supabase
      .from('servicios')
      .upsert(servicios, { onConflict: 'id' });
    console.log('Servicios:', serviciosError ? 'Error: ' + serviciosError.message : '✓');

    // 3. Clientes
    const { error: clientesError } = await supabase
      .from('clientes')
      .upsert(clientes, { onConflict: 'id' });
    console.log('Clientes:', clientesError ? 'Error: ' + clientesError.message : '✓');

    // 4. Proyectos
    const { error: proyectosError } = await supabase
      .from('proyectos')
      .upsert(proyectos, { onConflict: 'id' });
    console.log('Proyectos:', proyectosError ? 'Error: ' + proyectosError.message : '✓');

    // 5. Tareas
    const { error: tareasError } = await supabase
      .from('tareas')
      .upsert(tareas, { onConflict: 'id' });
    console.log('Tareas:', tareasError ? 'Error: ' + tareasError.message : '✓');

    // 6. Oportunidades
    const { error: oportunidadesError } = await supabase
      .from('oportunidades')
      .upsert(oportunidades, { onConflict: 'id' });
    console.log('Oportunidades:', oportunidadesError ? 'Error: ' + oportunidadesError.message : '✓');

    // 7. Facturas
    const { error: facturasError } = await supabase
      .from('facturas')
      .upsert(facturas, { onConflict: 'id' });
    console.log('Facturas:', facturasError ? 'Error: ' + facturasError.message : '✓');

    console.log('\n✓ Seed completado. Datos realistas cargados en Supabase.');
    console.log('Refresca https://crmadd.vercel.app para ver los cambios.');
    
  } catch (err) {
    console.error('Error en seed:', err);
  }
}

seed();

export default seed;