// Seguimiento automatico de propuestas: 24h / 3 dias / 7 dias.
import { supabase } from './supabase';

export const SEGUIMIENTOS = [
  { dias: 1, tipo: 'Seguimiento 24h', mensaje: 'Hola {nombre}, ¿recibiste nuestra propuesta? Quedamos atentos a tus comentarios.' },
  { dias: 3, tipo: 'Seguimiento 3 dias', mensaje: 'Hola {nombre}, pasaron 3 dias. ¿te gustaria que te cuente mas o agendamos una llamada?' },
  { dias: 7, tipo: 'Seguimiento 7 dias', mensaje: 'Hola {nombre}, queremos saber como vas. ¿te enviamos una propuesta ajustada?' },
];

export async function programarSeguimientos(cliente: any, base?: Date) {
  if (!cliente?.id) return { ok: false as const, error: 'sin cliente' };
  const desde = base || new Date();
  const rows = SEGUIMIENTOS.map((s) => ({
    cliente_id: cliente.id,
    cliente_nombre: cliente.nombre || '',
    telefono: cliente.telefono || '',
    tipo: s.tipo,
    mensaje: s.mensaje.replace('{nombre}', cliente.nombre || 'cliente'),
    programado_para: new Date(desde.getTime() + s.dias * 86400000).toISOString(),
    estado: 'pendiente',
  }));
  const { error } = await supabase.from('seguimientos').insert(rows);
  return { ok: !error, error };
}

export async function pendientes() {
  const { data, error } = await supabase
    .from('seguimientos')
    .select('*')
    .eq('estado', 'pendiente')
    .lte('programado_para', new Date().toISOString())
    .limit(50);
  return { data: data || [], error };
}

export async function marcarEnviado(id: number) {
  const { error } = await supabase.from('seguimientos').update({ estado: 'enviado' }).eq('id', id);
  return { ok: !error };
}
