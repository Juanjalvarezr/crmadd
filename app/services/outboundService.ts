// Cola de salida unificada: el CRM encola y n8n (OpenWA) envía.
// Flujo: ensure channel/contact/conversation -> INSERT conversation_messages (outbound, pending)
import { supabase } from './supabase';
import { renderPlantilla } from './templates';
import { generarYGuardarDocumento } from './docsHelper';

export interface ContactoSalida {
  id?: number | string;
  nombre?: string;
  telefono?: string;
  email?: string;
  empresa?: string;
}

async function ensureChannel(): Promise<number> {
  const { data } = await supabase
    .from('channels')
    .select('id')
    .eq('codigo', 'whatsapp')
    .maybeSingle();
  if (data?.id) return data.id as number;

  const { data: created, error } = await supabase
    .from('channels')
    .upsert(
      { codigo: 'whatsapp', nombre: 'WhatsApp', activo: true, config: {} },
      { onConflict: 'codigo' }
    )
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return (created?.id as number) ?? 1;
}

async function ensureContacto(channelId: number, c: ContactoSalida) {
  const externalId = String(c.telefono || c.email || c.id || 'sin-id');
  const { data, error } = await supabase
    .from('channel_contacts')
    .upsert(
      {
        channel_id: channelId,
        external_id: externalId,
        nombre: c.nombre || 'Sin nombre',
        telefono: c.telefono || null,
        email: c.email || null,
      },
      { onConflict: 'channel_id,external_id' }
    )
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data?.id as number;
}

async function ensureConversation(channelId: number, contactId: number, c: ContactoSalida) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('channel_id', channelId)
    .eq('contact_id', contactId)
    .maybeSingle();
  if (existing?.id) return existing.id as number;

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      channel_id: channelId,
      contact_id: contactId,
      estado: 'abierta',
      ultimo_mensaje: `Propuesta para ${c.nombre || 'cliente'}`,
    })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data?.id as number;
}

/**
 * Genera la propuesta (PDF -> Supabase Storage) y encola el WhatsApp para que n8n lo envie.
 * Devuelve { ok, url, mensaje }.
 */
export async function enviarMensajeWhatsApp(
  c: ContactoSalida,
  tipo: string,
  extra: Record<string, any> = {}
) {
  try {
    const channelId = await ensureChannel();

    // 1) Documento opcional (propuesta / cotizacion / contrato / factura)
    let docUrl = extra.doc_url || '';
    if (!docUrl && extra.doc_tipo) {
      const res = await generarYGuardarDocumento(extra.doc_tipo, {
        id: c.id,
        cliente_id: c.id,
        nombre: c.nombre,
        servicio: extra.servicio || '',
        ...extra,
      });
      if (!res.ok) throw new Error(res.error || 'No se pudo generar el documento');
      docUrl = res.url;
    }

    // 2) Contacto + conversacion
    const contactId = await ensureContacto(channelId, c);
    const conversationId = await ensureConversation(channelId, contactId, c);

    // 3) Mensaje personalizado con la plantilla elegida
    const cuerpo = renderPlantilla(tipo, {
      nombre: c.nombre || 'cliente',
      servicio: extra.servicio || 'nuestros servicios',
      agente: extra.agente || 'el equipo',
      doc_url: docUrl,
      monto: extra.monto || '',
      fecha: extra.fecha || '',
    });

    // 4) Encolar (n8n lo envia por OpenWA)
    const { error: insertError } = await supabase.from('conversation_messages').insert([
      {
        conversation_id: conversationId,
        direccion: 'outbound',
        tipo: 'texto',
        cuerpo,
        media_url: docUrl || null,
        estado: 'pending',
        enviado_por: 'crm',
      },
    ]);
    if (insertError) throw insertError;

    return { ok: true as const, url: docUrl, mensaje: cuerpo };
  } catch (e: any) {
    console.error('[outbound] error:', e);
    return { ok: false as const, error: e?.message || 'Error enviando mensaje' };
  }
}

export async function enviarPropuestaWhatsApp(c: ContactoSalida, extra: Record<string, any> = {}) {
  return enviarMensajeWhatsApp(c, 'propuesta', { doc_tipo: 'propuesta', ...extra });
}
