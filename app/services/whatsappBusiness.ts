import { supabase } from './supabase';

export interface WhatsAppTemplate {
  id: string;
  nombre: string;
  categoria: 'marketing' | 'utility' | 'authentication';
  contenido: string;
  variables?: string[];
  estado: 'aprobado' | 'pendiente' | 'rechazado';
  language_code: string;
}

export interface WhatsAppMessage {
  id: string;
  cliente_id: number;
  telefono: string;
  tipo: 'template' | 'texto' | 'media';
  contenido: string;
  template_id?: string;
  variables?: Record<string, string>;
  media_url?: string;
  media_tipo?: 'imagen' | 'video' | 'documento' | 'audio';
  estado: 'enviado' | 'entregado' | 'leido' | 'fallido';
  whatsapp_message_id?: string;
  enviado_at: string;
  entregado_at?: string;
  leido_at?: string;
  error?: string;
}

export interface WhatsAppWebhook {
  event: 'message_received' | 'message_delivered' | 'message_read' | 'message_failed';
  message_id: string;
  from: string;
  to: string;
  timestamp: number;
  data?: any;
}

/**
 * Plantillas predefinidas de WhatsApp
 */
const WHATSAPP_TEMPLATES_PREDEFINIDOS: Omit<WhatsAppTemplate, 'id'>[] = [
  {
    nombre: 'bienvenida_cliente',
    categoria: 'marketing',
    contenido: 'Hola {{nombre}}, gracias por contactar a DESEO DIGITAL. ¿En qué podemos ayudarte hoy?',
    variables: ['nombre'],
    estado: 'aprobado',
    language_code: 'es',
  },
  {
    nombre: 'confirmacion_cita',
    categoria: 'utility',
    contenido: 'Hola {{nombre}}, tu cita está confirmada para el {{fecha}} a las {{hora}}. Te esperamos.',
    variables: ['nombre', 'fecha', 'hora'],
    estado: 'aprobado',
    language_code: 'es',
  },
  {
    nombre: 'recordatorio_tarea',
    categoria: 'utility',
    contenido: 'Recordatorio: Tarea "{{tarea}}" vence el {{fecha}}.',
    variables: ['tarea', 'fecha'],
    estado: 'aprobado',
    language_code: 'es',
  },
  {
    nombre: 'propuesta_enviada',
    categoria: 'marketing',
    contenido: 'Hola {{nombre}}, hemos enviado tu propuesta personalizada. Revisa tu correo o contáctanos para más detalles.',
    variables: ['nombre'],
    estado: 'aprobado',
    language_code: 'es',
  },
  {
    nombre: 'followup_venta',
    categoria: 'marketing',
    contenido: 'Hola {{nombre}}, ¿tienes alguna pregunta sobre nuestra propuesta? Estamos disponibles para ayudarte.',
    variables: ['nombre'],
    estado: 'aprobado',
    language_code: 'es',
  },
];

/**
 * Inicializa las plantillas de WhatsApp en la base de datos
 */
export const inicializarWhatsAppTemplates = async (): Promise<void> => {
  try {
    const { data: existingTemplates } = await supabase.from('whatsapp_templates').select('id');
    
    if (!existingTemplates || existingTemplates.length === 0) {
      for (const template of WHATSAPP_TEMPLATES_PREDEFINIDOS) {
        await supabase.from('whatsapp_templates').insert(template);
      }
      console.log('Plantillas de WhatsApp inicializadas');
    }
  } catch (error) {
    console.error('Error inicializando WhatsApp templates:', error);
  }
};

/**
 * Envía un mensaje de WhatsApp
 */
export const enviarWhatsApp = async (
  clienteId: number,
  telefono: string,
  tipo: WhatsAppMessage['tipo'],
  contenido: string,
  opciones?: {
    template_id?: string;
    variables?: Record<string, string>;
    media_url?: string;
    media_tipo?: WhatsAppMessage['media_tipo'];
  }
): Promise<WhatsAppMessage> => {
  try {
    // Normalizar número de teléfono
    const telefonoNormalizado = normalizarTelefono(telefono);

    // Si es template, obtener y procesar
    let contenidoFinal = contenido;
    if (tipo === 'template' && opciones?.template_id) {
      const { data: template } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('id', opciones.template_id)
        .single();

      if (template) {
        contenidoFinal = template.contenido;
        if (opciones.variables && template.variables) {
          template.variables.forEach((variable: string) => {
            const valor = opciones.variables?.[variable] || '';
            contenidoFinal = contenidoFinal.replace(new RegExp(`{{${variable}}}`, 'g'), valor);
          });
        }
      }
    }

    // Aquí iría la integración real con WhatsApp Business API
    // Por ahora, simulamos el envío
    const whatsappMessageId = `wamid_${crypto.randomUUID()}`;
    
    console.log(`Enviando WhatsApp a ${telefonoNormalizado}:`, contenidoFinal);

    // Registrar mensaje en base de datos
    const message: Omit<WhatsAppMessage, 'id'> = {
      cliente_id: clienteId,
      telefono: telefonoNormalizado,
      tipo,
      contenido: contenidoFinal,
      template_id: opciones?.template_id,
      variables: opciones?.variables,
      media_url: opciones?.media_url,
      media_tipo: opciones?.media_tipo,
      estado: 'enviado',
      whatsapp_message_id: whatsappMessageId,
      enviado_at: new Date().toISOString(),
    };

    const { data: createdMessage } = await supabase
      .from('whatsapp_messages')
      .insert(message)
      .select()
      .single();

    return createdMessage;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    throw error;
  }
};

/**
 * Envía mensaje usando plantilla
 */
export const enviarWhatsAppTemplate = async (
  clienteId: number,
  telefono: string,
  templateNombre: string,
  variables: Record<string, string>
): Promise<WhatsAppMessage> => {
  try {
    // Obtener plantilla
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('nombre', templateNombre)
      .single();

    if (!template) throw new Error('Plantilla no encontrada');

    return await enviarWhatsApp(clienteId, telefono, 'template', template.contenido, {
      template_id: template.id,
      variables,
    });
  } catch (error) {
    console.error('Error enviando WhatsApp template:', error);
    throw error;
  }
};

/**
 * Envía mensaje masivo segmentado
 */
export const enviarWhatsAppMasivo = async (
  clienteIds: number[],
  templateNombre: string,
  variables: Record<string, string>[]
): Promise<WhatsAppMessage[]> => {
  try {
    const mensajes: WhatsAppMessage[] = [];

    for (let i = 0; i < clienteIds.length; i++) {
      const clienteId = clienteIds[i];
      const clienteVariables = variables[i] || {};

      // Obtener teléfono del cliente
      const { data: cliente } = await supabase
        .from('clientes')
        .select('telefono')
        .eq('id', clienteId)
        .single();

      if (!cliente?.telefono) continue;

      const mensaje = await enviarWhatsAppTemplate(
        clienteId,
        cliente.telefono,
        templateNombre,
        clienteVariables
      );

      mensajes.push(mensaje);
      
      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return mensajes;
  } catch (error) {
    console.error('Error enviando WhatsApp masivo:', error);
    throw error;
  }
};

/**
 * Procesa webhook de WhatsApp
 */
export const procesarWebhookWhatsApp = async (webhook: WhatsAppWebhook): Promise<void> => {
  try {
    switch (webhook.event) {
      case 'message_delivered':
        await actualizarEstadoMensaje(webhook.message_id, 'entregado');
        break;
      case 'message_read':
        await actualizarEstadoMensaje(webhook.message_id, 'leido');
        break;
      case 'message_failed':
        await actualizarEstadoMensaje(webhook.message_id, 'fallido', webhook.data?.error);
        break;
      case 'message_received':
        await procesarMensajeRecibido(webhook);
        break;
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
  }
};

/**
 * Actualiza el estado de un mensaje
 */
const actualizarEstadoMensaje = async (
  whatsappMessageId: string,
  estado: WhatsAppMessage['estado'],
  error?: string
): Promise<void> => {
  try {
    const updateData: any = {
      estado,
    };

    if (estado === 'entregado') {
      updateData.entregado_at = new Date().toISOString();
    } else if (estado === 'leido') {
      updateData.leido_at = new Date().toISOString();
    } else if (estado === 'fallido' && error) {
      updateData.error = error;
    }

    await supabase
      .from('whatsapp_messages')
      .update(updateData)
      .eq('whatsapp_message_id', whatsappMessageId);
  } catch (error) {
    console.error('Error actualizando estado mensaje:', error);
  }
};

/**
 * Procesa mensaje recibido de WhatsApp
 */
const procesarMensajeRecibido = async (webhook: WhatsAppWebhook): Promise<void> => {
  try {
    // Buscar cliente por teléfono
    const telefono = normalizarTelefono(webhook.from);
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .single();

    if (!cliente) {
      console.log('Mensaje de teléfono no registrado:', telefono);
      return;
    }

    // Registrar mensaje recibido
    await supabase.from('whatsapp_messages').insert({
      cliente_id: cliente.id,
      telefono: webhook.from,
      tipo: 'texto',
      contenido: webhook.data?.mensaje || '',
      estado: 'entregado',
      whatsapp_message_id: webhook.message_id,
      enviado_at: new Date(webhook.timestamp * 1000).toISOString(),
      entregado_at: new Date().toISOString(),
    });

    // Actualizar última interacción del cliente
    await supabase
      .from('clientes')
      .update({ ultima_interaccion: new Date().toISOString() })
      .eq('id', cliente.id);

    // Aquí se podría implementar lógica de respuesta automática
    // basada en el contenido del mensaje

  } catch (error) {
    console.error('Error procesando mensaje recibido:', error);
  }
};

/**
 * Normaliza número de teléfono
 */
const normalizarTelefono = (telefono: string): string => {
  // Eliminar espacios, guiones, paréntesis
  let normalizado = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Asegurar formato internacional para Colombia
  if (!normalizado.startsWith('+57')) {
    normalizado = '+57' + normalizado;
  }
  
  return normalizado;
};

/**
 * Obtiene el historial de mensajes de WhatsApp de un cliente
 */
export const getHistorialWhatsApp = async (clienteId: number): Promise<WhatsAppMessage[]> => {
  try {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('enviado_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial WhatsApp:', error);
    return [];
  }
};

/**
 * Obtiene métricas de WhatsApp
 */
export const getWhatsAppMetrics = async (fechaDesde?: string, fechaHasta?: string): Promise<any> => {
  try {
    let query = supabase.from('whatsapp_messages').select('*');

    if (fechaDesde) {
      query = query.gte('enviado_at', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('enviado_at', fechaHasta);
    }

    const { data: messages } = await query;

    if (!messages) return null;

    const enviados = messages.length;
    const entregados = messages.filter(m => m.estado === 'entregado' || m.estado === 'leido').length;
    const leidos = messages.filter(m => m.estado === 'leido').length;
    const fallidos = messages.filter(m => m.estado === 'fallido').length;

    return {
      enviados,
      entregados,
      leidos,
      fallidos,
      tasaEntrega: enviados > 0 ? (entregados / enviados) * 100 : 0,
      tasaLectura: enviados > 0 ? (leidos / enviados) * 100 : 0,
    };
  } catch (error) {
    console.error('Error obteniendo métricas WhatsApp:', error);
    return null;
  }
};

/**
 * Configura respuestas automáticas basadas en palabras clave
 */
export const configurarRespuestaAutomatica = async (
  palabraClave: string,
  respuesta: string,
  activo: boolean = true
): Promise<void> => {
  try {
    await supabase.from('whatsapp_autorespuestas').insert({
      palabra_clave: palabraClave.toLowerCase(),
      respuesta,
      activo,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error configurando respuesta automática:', error);
  }
};

/**
 * Busca respuesta automática para un mensaje
 */
export const buscarRespuestaAutomatica = async (mensaje: string): Promise<string | null> => {
  try {
    const mensajeLower = mensaje.toLowerCase();
    
    const { data: respuestas } = await supabase
      .from('whatsapp_autorespuestas')
      .select('*')
      .eq('activo', true);

    if (!respuestas) return null;

    for (const respuesta of respuestas) {
      if (mensajeLower.includes(respuesta.palabra_clave)) {
        return respuesta.respuesta;
      }
    }

    return null;
  } catch (error) {
    console.error('Error buscando respuesta automática:', error);
    return null;
  }
};
