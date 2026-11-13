// Registro de gestiones/acciones sobre una persona + etapa del proceso + envío opcional.
import { interaccionesService, clientesService } from './supabase';
import { enviarMensajeWhatsApp } from './outboundService';

export interface TipoGestion {
  value: string;
  etapa: string | null; // etapa del proceso comercial (clientes.etapa)
  plantilla: string | null; // plantilla de WhatsApp a usar si se elige enviar
}

export const TIPOS_GESTION: TipoGestion[] = [
  { value: 'Asesoría', etapa: 'Interesado', plantilla: null },
  { value: 'Cotización', etapa: 'Propuesta', plantilla: 'saludo' },
  { value: 'Propuesta', etapa: 'Propuesta', plantilla: 'propuesta' },
  { value: 'Interés', etapa: 'Interesado', plantilla: null },
  { value: 'Servicios consultados', etapa: 'Interesado', plantilla: null },
  { value: 'Compromiso', etapa: 'Negociación', plantilla: null },
  { value: 'WhatsApp', etapa: null, plantilla: null },
  { value: 'Email', etapa: null, plantilla: null },
  { value: 'Llamada', etapa: null, plantilla: null },
  { value: 'Cita', etapa: null, plantilla: null },
  { value: 'Nota', etapa: null, plantilla: null },
];

export const ETAPAS = ['Nuevo', 'Interesado', 'Propuesta', 'Negociación', 'Ganado', 'Perdido'];

export async function registrarGestion(params: {
  cliente: any;
  tipo: string;
  asunto?: string;
  contenido?: string;
  enviar?: 'whatsapp' | 'email' | null;
  servicio?: string;
  monto?: string;
}) {
  const tipo = params.tipo || 'Nota';
  const def = TIPOS_GESTION.find((t) => t.value === tipo);

  // 1) Historial (interacciones)
  await interaccionesService.create({
    cliente_id: Number(params.cliente.id),
    tipo: tipo as any,
    asunto: params.asunto || tipo,
    contenido: params.contenido || '',
    usuario: 'Asistente IA',
  });

  // 2) Etapa del proceso comercial
  if (def?.etapa) {
    await clientesService.update(Number(params.cliente.id), {
      etapa: def.etapa,
      ultima_interaccion: new Date().toISOString(),
    } as any);
  }

  // 3) Envío opcional por WhatsApp (n8n -> OpenWA)
  let envio: any = null;
  if (params.enviar === 'whatsapp' && params.cliente.telefono && def?.plantilla) {
    envio = await enviarMensajeWhatsApp(params.cliente, def.plantilla as string, {
      servicio: params.servicio || 'nuestros servicios',
      agente: 'el equipo',
      monto: params.monto,
    });
  }

  return { ok: true, etapa: def?.etapa || null, envio };
}
