// Lógica unificada de acciones post-escaneo de tarjeta.
// Un solo lugar para: guardar cliente (con dedupe), registrar traza y enviar por el canal elegido.
import { clientesService, interaccionesService } from './supabase';
import { enviarMensajeWhatsApp } from './outboundService';

export type ScannerAction = 'propuesta' | 'cotizacion' | 'factura' | 'whatsapp' | 'llamar';
export type Canal = 'whatsapp' | 'email' | 'ambos';

export interface DatosTarjeta {
  nombre?: string;
  empresa?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  web?: string;
  redes?: string[];
  texto?: string;
}

const normTel = (t?: string) => String(t || '').replace(/\D/g, '');

/** Busca un cliente existente por teléfono (normalizado) o email. */
export async function buscarDuplicado(d: DatosTarjeta): Promise<any | null> {
  const tel = normTel(d.telefono);
  const email = String(d.email || '').trim().toLowerCase();
  const clientes = await clientesService.getAll();
  return (
    clientes.find((c: any) => tel && normTel(c.telefono) === tel) ||
    clientes.find((c: any) => email && String(c.email || '').trim().toLowerCase() === email) ||
    null
  );
}

/** Guarda el cliente (o reutiliza el existente) y deja una nota de traza. */
export async function guardarClienteTarjeta(
  d: DatosTarjeta,
  opts: { reutilizarId?: number } = {}
): Promise<{ cliente: any; reutilizado: boolean }> {
  if (opts.reutilizarId) {
    const clientes = await clientesService.getAll();
    const existente = clientes.find((c: any) => Number(c.id) === Number(opts.reutilizarId));
    if (existente) {
      await interaccionesService.create({
        cliente_id: existente.id,
        tipo: 'Nota',
        asunto: 'Tarjeta escaneada (cliente existente)',
        contenido: `Tarjeta re-escaneada. ${d.texto || ''}`.trim(),
        usuario: 'Asistente IA',
      } as any);
      return { cliente: existente, reutilizado: true };
    }
  }
  const cliente = await clientesService.create({
    nombre: d.nombre || 'Sin nombre',
    email: d.email || '',
    telefono: d.telefono || '',
    empresa: d.empresa || '',
    estado: 'Activo',
  } as any);
  if (cliente?.id) {
    await interaccionesService.create({
      cliente_id: cliente.id,
      tipo: 'Nota',
      asunto: 'OCR - Tarjeta escaneada',
      contenido: `Datos extraídos: ${d.texto || ''}`.trim(),
      usuario: 'Asistente IA',
    } as any);
  }
  return { cliente, reutilizado: false };
}

/** Ejecuta la acción elegida sobre el cliente ya guardado. */
export async function ejecutarAccionTarjeta(
  cliente: any,
  d: DatosTarjeta,
  action: ScannerAction,
  canal: Canal = 'whatsapp'
): Promise<{ ok: boolean; mensaje: string }> {
  const c = {
    id: cliente?.id,
    nombre: cliente?.nombre || d.nombre,
    telefono: cliente?.telefono || d.telefono,
    email: cliente?.email || d.email,
    empresa: cliente?.empresa || d.empresa,
  };

  if (action === 'llamar') {
    const tel = normTel(c.telefono);
    if (!tel) return { ok: false, mensaje: 'Sin teléfono para llamar' };
    if (cliente?.id) {
      await interaccionesService.create({
        cliente_id: cliente.id,
        tipo: 'Llamada',
        asunto: 'Llamada desde tarjeta escaneada',
        contenido: `Intento de llamada al ${c.telefono}`,
        usuario: 'Asistente IA',
      } as any);
    }
    window.open(`tel:${tel}`, '_self');
    return { ok: true, mensaje: 'Llamada iniciada y registrada' };
  }

  const tipoPlantilla = action === 'whatsapp' ? 'saludo' : action;
  const extra: Record<string, any> = {
    servicio: c.empresa || 'nuestros servicios',
    agente: 'el equipo',
    canal,
  };
  if (action !== 'whatsapp') extra.doc_tipo = action;
  if (action === 'factura') {
    extra.monto = 'según factura';
    extra.fecha = new Date().toLocaleDateString('es-CO');
  }

  const res = await enviarMensajeWhatsApp(c as any, tipoPlantilla, extra);
  if (!res.ok) return { ok: false, mensaje: res.error || 'No se pudo encolar' };

  const destinatarios = canal === 'ambos' ? 'WhatsApp y correo' : canal === 'email' ? 'correo' : 'WhatsApp';
  await interaccionesService.create({
    cliente_id: cliente.id,
    tipo: 'Nota',
    asunto: `Tarjeta escaneada - ${action} por ${destinatarios}`,
    contenido: `Acción "${action}" encolada por ${destinatarios}.`,
    usuario: 'Asistente IA',
  } as any);

  return { ok: true, mensaje: `${action} enviada por ${destinatarios}` };
}
