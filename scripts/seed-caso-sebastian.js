/**
 * Script temporal para cerrar caso real Sebastian Uribe.
 * Ejecutar: node scripts/seed-caso-sebastian.js
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env no encontrado');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const out = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const clienteNombre = 'Sebastian Uribe';
  const clienteEmail = 'Tiendashogarcity@gmail.com';
  const clienteTelefono = '3143849671';
  const clienteEmpresa = 'Tiendas Hogar City';

  const cliente = await supabase
    .from('clientes')
    .select('id, nombre, email')
    .eq('email', clienteEmail)
    .maybeSingle();

  if (cliente.error) throw cliente.error;
  let clienteId = cliente.data?.id;

  if (!clienteId) {
    const insert = await supabase.from('clientes').insert({
      nombre: clienteNombre,
      email: clienteEmail,
      telefono: clienteTelefono,
      empresa: clienteEmpresa,
      estado: 'activo',
      origen: 'CRM Caso Real',
      dolores: 'Baja conversion en pagos parciales y dificultad para facturar por cuotas',
      necesidades: 'Unificar pagos, cronograma de entregas y seguimiento en un solo CRM',
      nicho: 'E-commerce',
      origen_lead: 'Referido',
      ultima_interaccion: new Date().toISOString().split('T')[0],
    }).select('id').maybeSingle();
    if (insert.error) throw insert.error;
    clienteId = insert.data.id;
  }

  const proyectoNombre = 'Estrategia Contenido 2 meses - Tiendas Hogar City';
  const proyecto = await supabase
    .from('proyectos')
    .select('id, nombre')
    .eq('cliente_id', clienteId)
    .eq('nombre', proyectoNombre)
    .maybeSingle();

  if (proyecto.error) throw proyecto.error;
  let proyectoId = proyecto.data?.id;

  if (!proyectoId) {
    const hoy = new Date().toISOString().split('T')[0];
    const fin = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const insert = await supabase.from('proyectos').insert({
      nombre: proyectoNombre,
      descripcion: 'Proyecto integral de marketing digital con contenido, pauta y estrategia comercial para Tiendas Hogar City',
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      servicios: ['contenido', 'pauta', 'estrategia_comercial'],
      estado: 'planificacion',
      prioridad: 'alta',
      fecha_inicio: hoy,
      fecha_fin: fin,
      presupuesto: 1000000,
      monto_pagado: 0,
      origen: 'CRM Caso Real',
      onboarding_checklist: {},
      brief: '',
      cronograma: [],
      recursos: [],
      tareas: [],
    }).select('id').maybeSingle();
    if (insert.error) throw insert.error;
    proyectoId = insert.data.id;
  }

  await supabase.from('tareas').insert([
    { titulo: 'Definir paquete de contenido para reels', estado: 'pendiente', prioridad: 'alta', proyecto_id: proyectoId },
    { titulo: 'Definir paquete de contenido para historias', estado: 'pendiente', prioridad: 'alta', proyecto_id: proyectoId },
    { titulo: 'Crear calendario de publicación mensual', estado: 'pendiente', prioridad: 'media', proyecto_id: proyectoId },
    { titulo: 'Diseñar hook visual y guión primer reel', estado: 'pendiente', prioridad: 'alta', proyecto_id: proyectoId },
    { titulo: 'Setear seguimiento de leads y pagos', estado: 'pendiente', prioridad: 'media', proyecto_id: proyectoId },
  ]);

  await supabase.from('cronograma').insert([
    { proyecto_id: proyectoId, titulo: 'Semana 1: diagnóstico y brief', completado: true, fecha: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] },
    { proyecto_id: proyectoId, titulo: 'Semana 2: guiones y pruebas de mensajes', completado: false, fecha: new Date().toISOString().split('T')[0] },
    { proyecto_id: proyectoId, titulo: 'Semana 3-4: reels y pauta inicial', completado: false, fecha: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] },
    { proyecto_id: proyectoId, titulo: 'Mes 2: historias + optimize funnel y cierre', completado: false, fecha: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0] },
  ]);

  const factura = await supabase.from('facturas').select('id').eq('proyecto_id', proyectoId).maybeSingle();
  if (!factura.data) {
    await supabase.from('facturas').insert({
      proyecto_id: proyectoId,
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      numero: 'FAC-' + Date.now().toString().slice(-6),
      concepto: 'Estrategia contenido 2 meses - Tiendas Hogar City',
      monto: 1000000,
      estado_pago: 'pendiente',
      metodo_pago: 'cuotas',
    });
  }

  const contrato = await supabase.from('contratos').select('id').eq('proyecto_id', proyectoId).maybeSingle();
  if (!contrato.data) {
    await supabase.from('contratos').insert({
      proyecto_id: proyectoId,
      cliente_id: clienteId,
      titulo: 'Contrato prestación de servicios - ' + clienteNombre,
      tipo: 'servicios',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monto: 1000000,
      estado: 'borrador',
      descripcion: 'Alcance: contenido, pauta y estrategia comercial. Incluye reels, historias, cronograma y control de pagos.',
    });
  }

  await supabase.from('logs').insert({ modulo: 'seed', accion: 'seed caso sebastian', detalle: { clienteId, proyectoId } });

  console.log('CASO_REAL_OK');
  console.log(JSON.stringify({ clienteId, proyectoId, clienteNombre, proyectoNombre }, null, 2));
}

main().catch((err) => {
  console.error('CASO_REAL_FAIL');
  console.error(err);
  process.exit(1);
});
