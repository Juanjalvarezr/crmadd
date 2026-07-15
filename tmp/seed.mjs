import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function getEnvVar(key) {
  const text = fs.readFileSync('.env', 'utf8');
  const m = text.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : null;
}

const url = getEnvVar('VITE_SUPABASE_URL');
const serviceRole = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

async function run() {
  const clientes = [
    { nombre: 'María Fernanda López', email: 'maria@tiendanova.com', telefono: '300 111 2233', empresa: 'Tienda Nova', nicho: 'E-commerce', origen: 'Referido', estado: 'Activo' },
    { nombre: 'Carlos Ramírez', email: 'carlos@inmobiliaria.com', telefono: '311 222 3344', empresa: 'Inmobiliaria Carlos Ramírez', nicho: 'Inmobiliaria', origen: 'Web', estado: 'Activo' },
    { nombre: 'Laura Martínez', email: 'laura@restaurantesabor.com', telefono: '312 333 4455', empresa: 'Restaurante Sabor', nicho: 'Gastronomía', origen: 'Instagram', estado: 'Activo' },
  ];
  for (const c of clientes) {
    const { data: existing } = await supabase.from('clientes').select('id').eq('email', c.email).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from('clientes').insert(c);
      if (error) console.error('CLIENTE ERROR', c.email, error.message);
      else console.log('CLIENTE OK', c.email);
    } else {
      console.log('CLIENTE SKIP', c.email);
    }
  }

  const proyectos = [
    { nombre: 'E-commerce Tienda Nova', descripcion: 'Desarrollo de tienda en línea', presupuesto: 8500000, costo_actual: 4200000, estado: 'en_progreso', prioridad: 'Alta', fecha_inicio: '2025-01-15', fecha_fin: '2025-03-30', progreso: 65 },
    { nombre: 'Página Web Inmobiliaria', descripcion: 'Sitio web corporativo', presupuesto: 6200000, costo_actual: 3100000, estado: 'en_progreso', prioridad: 'Media', fecha_inicio: '2025-02-01', fecha_fin: '2025-04-15', progreso: 50 },
    { nombre: 'Branding Restaurante Sabor', descripcion: 'Identidad visual y social media', presupuesto: 4500000, costo_actual: 1800000, estado: 'planificacion', prioridad: 'Alta', fecha_inicio: '2025-03-01', fecha_fin: '2025-05-30', progreso: 20 },
  ];
  const clienteMap = {};
  for (const c of clientes) {
    const { data } = await supabase.from('clientes').select('id').eq('email', c.email).single();
    clienteMap[c.email] = data?.id || null;
  }
  const proyectoMap = {};
  for (const p of proyectos) {
    const { data: existing } = await supabase.from('proyectos').select('id').eq('nombre', p.nombre).maybeSingle();
    if (!existing) {
      const email = p.nombre.includes('Tienda') ? 'maria@tiendanova.com' : p.nombre.includes('Inmobiliaria') ? 'carlos@inmobiliaria.com' : 'laura@restaurantesabor.com';
      const row = { ...p, cliente_id: clienteMap[email], cliente_nombre: clientes.find(x => x.email === email)?.nombre || '' };
      const { error } = await supabase.from('proyectos').insert(row);
      if (error) console.error('PROYECTO ERROR', p.nombre, error.message);
      else console.log('PROYECTO OK', p.nombre);
    } else {
      proyectoMap[p.nombre] = existing.id;
      console.log('PROYECTO SKIP', p.nombre);
    }
  }
  const { data: proyectosData } = await supabase.from('proyectos').select('id,nombre');
  if (proyectosData) {
    for (const p of proyectosData) proyectoMap[p.nombre] = p.id;
  }

  const tareas = [
    { titulo: 'Diseño mockups e-commerce', proyecto_nombre: 'E-commerce Tienda Nova', cliente_email: 'maria@tiendanova.com', descripcion: 'Crear mockups', fecha: '2025-01-20', prioridad: 'Alta', estado: 'En progreso', tipo: 'Tarea' },
    { titulo: 'Configurar pasarela de pagos', proyecto_nombre: 'E-commerce Tienda Nova', cliente_email: 'maria@tiendanova.com', descripcion: 'Integrar pagos', fecha: '2025-02-05', prioridad: 'Alta', estado: 'Pendiente', tipo: 'Tarea' },
    { titulo: 'Reunión kick-off inmobiliaria', proyecto_nombre: 'Página Web Inmobiliaria', cliente_email: 'carlos@inmobiliaria.com', descripcion: 'Presentación', fecha: '2025-02-10', prioridad: 'Media', estado: 'Pendiente', tipo: 'Cita' },
    { titulo: 'Diseño de logotipo y paleta', proyecto_nombre: 'Branding Restaurante Sabor', cliente_email: 'laura@restaurantesabor.com', descripcion: 'Propuesta branding', fecha: '2025-03-10', prioridad: 'Alta', estado: 'Pendiente', tipo: 'Tarea' },
  ];
  for (const t of tareas) {
    const { data: existing } = await supabase.from('tareas').select('id').eq('titulo', t.titulo).maybeSingle();
    if (!existing) {
      const row = { ...t, proyecto_id: proyectoMap[t.proyecto_nombre] || null, cliente_id: clienteMap[t.cliente_email] || null };
      const { error } = await supabase.from('tareas').insert(row);
      if (error) console.error('TAREA ERROR', t.titulo, error.message);
      else console.log('TAREA OK', t.titulo);
    } else {
      console.log('TAREA SKIP', t.titulo);
    }
  }

  const oportunidades = [
    { titulo: 'Renovación anual Tienda Nova', descripcion: 'Hosting', valor: 2400000, etapa: 'Propuesta', probabilidad: 70, estado: 'Abierta', cliente_email: 'maria@tiendanova.com', cliente_nombre: 'María Fernanda López' },
    { titulo: 'App móvil inmobiliaria', descripcion: 'Desarrollo app', valor: 12500000, etapa: 'Prospección', probabilidad: 40, estado: 'Abierta', cliente_email: 'carlos@inmobiliaria.com', cliente_nombre: 'Carlos Ramírez' },
  ];
  for (const o of oportunidades) {
    const { data: existing } = await supabase.from('oportunidades').select('id').eq('titulo', o.titulo).maybeSingle();
    if (!existing) {
      const row = { titulo: o.titulo, descripcion: o.descripcion, valor: o.valor, etapa: o.etapa, probabilidad: o.probabilidad, estado: o.estado, cliente_id: clienteMap[o.cliente_email] || null, cliente_nombre: o.cliente_nombre };
      const { error } = await supabase.from('oportunidades').insert(row);
      if (error) console.error('OPORTUNIDAD ERROR', o.titulo, error.message);
      else console.log('OPORTUNIDAD OK', o.titulo);
    } else {
      console.log('OPORTUNIDAD SKIP', o.titulo);
    }
  }

  const transacciones = [
    { monto: 4250000, tipo: 'ingreso', categoria: 'Pago proyecto', fecha: '2025-01-30', proyecto_nombre: 'E-commerce Tienda Nova' },
    { monto: 3100000, tipo: 'ingreso', categoria: 'Pago proyecto', fecha: '2025-02-15', proyecto_nombre: 'Página Web Inmobiliaria' },
    { monto: 150000, tipo: 'egreso', categoria: 'Herramientas', fecha: '2025-01-10' },
  ];
  for (const t of transacciones) {
    const { data: existing } = await supabase.from('transacciones').select('id').eq('monto', t.monto).eq('tipo', t.tipo).eq('categoria', t.categoria).maybeSingle();
    if (!existing) {
      const row = { monto: t.monto, tipo: t.tipo, categoria: t.categoria, fecha: t.fecha, proyecto_id: t.proyecto_nombre ? proyectoMap[t.proyecto_nombre] || null : null };
      const { error } = await supabase.from('transacciones').insert(row);
      if (error) console.error('TRANSACCION ERROR', t.monto, t.categoria, error.message);
      else console.log('TRANSACCION OK', t.monto, t.categoria);
    } else {
      console.log('TRANSACCION SKIP', t.monto, t.categoria);
    }
  }

  console.log('SEED COMPLETADO');
}

run().catch((e) => { console.error(e); process.exit(1); });
