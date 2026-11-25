// Seguimiento automatico de propuestas: D+1 confirmacion / D+7 valor / D+30 cierre.
// Regla: maximo UNA secuencia activa por cliente. Programar de nuevo cancela la anterior.
import { supabase } from './supabase';

export const SEGUIMIENTOS = [
  {
    dias: 1,
    tipo: 'Seguimiento D+1',
    mensaje:
      'Hola {nombre}, soy del equipo de Deseo Digital. ¿pudiste revisar la propuesta que te envié? Con gusto te aclaro cualquier duda.',
  },
  {
    dias: 7,
    tipo: 'Seguimiento D+7',
    mensaje:
      'Hola {nombre}, te comparto un caso real de resultados con este tipo de servicio por si te sirve para decidir. ¿te parece si hablamos 10 minutos esta semana?',
  },
  {
    dias: 30,
    tipo: 'Seguimiento D+30',
    mensaje:
      'Hola {nombre}, cierro este seguimiento por ahora. Quedo atento si en otro momento quieres retomarlo. Un saludo.',
  },
];

export async function programarSeguimientos(cliente: any, base?: Date) {
  if (!cliente?.id) return { ok: false as const, error: 'sin cliente' };
  const telefono = String(cliente.telefono || '').trim();
  if (!telefono) return { ok: false as const, error: 'sin telefono' };

  const desde = base || new Date();

  // Cancelar la secuencia anterior (pendiente o en envio): nunca dos secuencias vivas.
  await supabase
    .from('seguimientos')
    .update({ estado: 'cancelado' })
    .eq('cliente_id', cliente.id)
    .in('estado', ['pendiente', 'enviando']);

  const rows = SEGUIMIENTOS.map((s) => ({
    cliente_id: cliente.id,
    cliente_nombre: cliente.nombre || '',
    telefono,
    tipo: s.tipo,
    mensaje: s.mensaje.replace('{nombre}', cliente.nombre || 'cliente'),
    programado_para: new Date(desde.getTime() + s.dias * 86400000).toISOString(),
    estado: 'pendiente',
  }));

  const { error } = await supabase.from('seguimientos').insert(rows);
  return { ok: !error, error };
}

export async function cancelarSeguimientos(clienteId: string | number) {
  const { error } = await supabase
    .from('seguimientos')
    .update({ estado: 'cancelado' })
    .eq('cliente_id', clienteId)
    .in('estado', ['pendiente', 'enviando']);
  return { ok: !error, error };
}

export async function pendientes() {
  const { data, error } = await supabase
    .from('seguimientos')
    .select('*')
    .eq('estado', 'pendiente')
    .lte('programado_para', new Date().toISOString())
    .order('programado_para', { ascending: true })
    .limit(50);
  return { data: data || [], error };
}

export async function marcarEnviado(id: number) {
  const { error } = await supabase.from('seguimientos').update({ estado: 'enviado' }).eq('id', id);
  return { ok: !error, error };
}
