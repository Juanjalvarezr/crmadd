// Alertas globales: clientes que necesitan atencion (reglas, sin IA).
import { supabase } from './supabase';

export interface Alerta {
  id: string;
  tipo: 'sin_contacto' | 'propuesta' | 'sin_gestion' | 'sin_telefono';
  cliente: string;
  mensaje: string;
  severidad: 'alta' | 'media' | 'baja';
}

export async function getAlertas(): Promise<Alerta[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, telefono, ultima_interaccion, etapa')
    .limit(300);
  if (error) {
    console.error('[alertas]', error);
    return [];
  }
  const ahora = Date.now();
  const out: Alerta[] = [];

  for (const c of data || []) {
    const dias = c.ultima_interaccion
      ? Math.floor((ahora - new Date(c.ultima_interaccion).getTime()) / 86400000)
      : 999;

    if (!c.telefono) {
      out.push({ id: `${c.id}-tel`, tipo: 'sin_telefono', cliente: c.nombre, mensaje: 'Sin teléfono (no se puede enviar WhatsApp)', severidad: 'baja' });
    }
    if (dias >= 7) {
      out.push({ id: `${c.id}-contacto`, tipo: 'sin_contacto', cliente: c.nombre, mensaje: `Sin contacto hace ${dias} días`, severidad: 'alta' });
    }
    if (c.etapa === 'Propuesta' && dias >= 3) {
      out.push({ id: `${c.id}-prop`, tipo: 'propuesta', cliente: c.nombre, mensaje: 'Propuesta enviada sin respuesta (3+ días)', severidad: 'media' });
    }
  }

  const orden = { alta: 0, media: 1, baja: 2 };
  return out.sort((a, b) => orden[a.severidad] - orden[b.severidad]).slice(0, 12);
}
