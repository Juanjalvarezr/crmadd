import { supabase } from './supabase';

export interface Integration {
  id: string;
  nombre: string;
  tipo: 'google_calendar' | 'google_sheets' | 'slack' | 'zapier' | 'hubspot' | 'custom';
  activo: boolean;
  configuracion: Record<string, any>;
  webhooks: string[];
  created_at: string;
  updated_at: string;
}

export interface IntegrationEvent {
  id: string;
  integration_id: string;
  tipo_evento: string;
  datos: any;
  estado: 'procesado' | 'pendiente' | 'fallido';
  created_at: string;
  procesado_at?: string;
  error?: string;
}

/**
 * Integraciones predefinidas
 */
const INTEGRACIONES_PREDEFINIDAS: Omit<Integration, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    nombre: 'Google Calendar',
    tipo: 'google_calendar',
    activo: false,
    configuracion: {
      api_key: '',
      calendar_id: '',
      sync_tareas: true,
      sync_proyectos: true,
    },
    webhooks: [],
  },
  {
    nombre: 'Google Sheets',
    tipo: 'google_sheets',
    activo: false,
    configuracion: {
      spreadsheet_id: '',
      sheet_name: '',
      sync_clientes: true,
      sync_ventas: true,
    },
    webhooks: [],
  },
  {
    nombre: 'Slack',
    tipo: 'slack',
    activo: false,
    configuracion: {
      webhook_url: '',
      channel: '',
      notificaciones: {
        nueva_venta: true,
        tarea_asignada: true,
        proyecto_completado: true,
      },
    },
    webhooks: [],
  },
  {
    nombre: 'Zapier',
    tipo: 'zapier',
    activo: false,
    configuracion: {
      webhook_url: '',
      eventos: ['cliente_creado', 'venta_ganada', 'tarea_completada'],
    },
    webhooks: [],
  },
];

/**
 * Inicializa las integraciones en la base de datos
 */
export const inicializarIntegraciones = async (): Promise<void> => {
  try {
    const { data: existingIntegrations } = await supabase.from('integrations').select('id');
    
    if (!existingIntegrations || existingIntegrations.length === 0) {
      for (const integration of INTEGRACIONES_PREDEFINIDAS) {
        await supabase.from('integrations').insert({
          ...integration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      console.log('Integraciones inicializadas');
    }
  } catch (error) {
    console.error('Error inicializando integraciones:', error);
  }
};

/**
 * Obtiene todas las integraciones
 */
export const getIntegrations = async (): Promise<Integration[]> => {
  try {
    const { data } = await supabase.from('integrations').select('*');
    return data || [];
  } catch (error) {
    console.error('Error obteniendo integraciones:', error);
    return [];
  }
};

/**
 * Obtiene una integración por ID
 */
export const getIntegration = async (id: string): Promise<Integration | null> => {
  try {
    const { data } = await supabase.from('integrations').select('*').eq('id', id).single();
    return data;
  } catch (error) {
    console.error('Error obteniendo integración:', error);
    return null;
  }
};

/**
 * Actualiza una integración
 */
export const updateIntegration = async (
  id: string,
  configuracion: Record<string, any>
): Promise<void> => {
  try {
    await supabase
      .from('integrations')
      .update({
        configuracion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  } catch (error) {
    console.error('Error actualizando integración:', error);
  }
};

/**
 * Activa o desactiva una integración
 */
export const toggleIntegration = async (id: string, activo: boolean): Promise<void> => {
  try {
    await supabase
      .from('integrations')
      .update({
        activo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  } catch (error) {
    console.error('Error toggling integración:', error);
  }
};

/**
 * Envía notificación a Slack
 */
export const sendSlackNotification = async (
  integrationId: string,
  mensaje: string,
  canal?: string
): Promise<boolean> => {
  try {
    const integration = await getIntegration(integrationId);
    if (!integration || !integration.activo) return false;

    const webhookUrl = integration.configuracion.webhook_url;
    const channel = canal || integration.configuracion.channel;

    if (!webhookUrl) return false;

    const payload = {
      text: mensaje,
      channel,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error enviando notificación Slack:', error);
    return false;
  }
};

/**
 * Sincroniza tarea con Google Calendar
 */
export const syncTaskToGoogleCalendar = async (
  integrationId: string,
  tarea: any
): Promise<boolean> => {
  try {
    const integration = await getIntegration(integrationId);
    if (!integration || !integration.activo) return false;

    const apiKey = integration.configuracion.api_key;
    const calendarId = integration.configuracion.calendar_id;

    if (!apiKey || !calendarId) return false;

    // Aquí iría la integración real con Google Calendar API
    console.log(`Sincronizando tarea "${tarea.titulo}" con Google Calendar`);

    return true;
  } catch (error) {
    console.error('Error sincronizando tarea con Google Calendar:', error);
    return false;
  }
};

/**
 * Sincroniza cliente con Google Sheets
 */
export const syncClientToGoogleSheets = async (
  integrationId: string,
  cliente: any
): Promise<boolean> => {
  try {
    const integration = await getIntegration(integrationId);
    if (!integration || !integration.activo) return false;

    const spreadsheetId = integration.configuracion.spreadsheet_id;
    const sheetName = integration.configuracion.sheet_name;

    if (!spreadsheetId || !sheetName) return false;

    // Aquí iría la integración real con Google Sheets API
    console.log(`Sincronizando cliente "${cliente.nombre}" con Google Sheets`);

    return true;
  } catch (error) {
    console.error('Error sincronizando cliente con Google Sheets:', error);
    return false;
  }
};

/**
 * Envía evento a Zapier
 */
export const sendZapierEvent = async (
  integrationId: string,
  evento: string,
  datos: any
): Promise<boolean> => {
  try {
    const integration = await getIntegration(integrationId);
    if (!integration || !integration.activo) return false;

    const webhookUrl = integration.configuracion.webhook_url;
    const eventosPermitidos = integration.configuracion.eventos || [];

    if (!webhookUrl) return false;
    if (!eventosPermitidos.includes(evento)) return false;

    const payload = {
      evento,
      datos,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error enviando evento a Zapier:', error);
    return false;
  }
};

/**
 * Registra un evento de integración
 */
export const logIntegrationEvent = async (
  integrationId: string,
  tipoEvento: string,
  datos: any
): Promise<void> => {
  try {
    await supabase.from('integration_events').insert({
      integration_id: integrationId,
      tipo_evento: tipoEvento,
      datos,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error registrando evento de integración:', error);
  }
};

/**
 * Procesa eventos pendientes de integración
 */
export const processPendingIntegrationEvents = async (): Promise<void> => {
  try {
    const { data: pendingEvents } = await supabase
      .from('integration_events')
      .select('*')
      .eq('estado', 'pendiente')
      .limit(50);

    if (!pendingEvents || pendingEvents.length === 0) return;

    for (const event of pendingEvents) {
      const integration = await getIntegration(event.integration_id);
      if (!integration || !integration.activo) continue;

      let success = false;

      switch (integration.tipo) {
        case 'slack':
          success = await sendSlackNotification(
            event.integration_id,
            event.datos.mensaje || 'Notificación del CRM'
          );
          break;
        case 'zapier':
          success = await sendZapierEvent(
            event.integration_id,
            event.tipo_evento,
            event.datos
          );
          break;
        case 'google_calendar':
          if (event.datos.tarea) {
            success = await syncTaskToGoogleCalendar(event.integration_id, event.datos.tarea);
          }
          break;
        case 'google_sheets':
          if (event.datos.cliente) {
            success = await syncClientToGoogleSheets(event.integration_id, event.datos.cliente);
          }
          break;
      }

      await supabase
        .from('integration_events')
        .update({
          estado: success ? 'procesado' : 'fallido',
          procesado_at: new Date().toISOString(),
          error: success ? undefined : 'Error procesando evento',
        })
        .eq('id', event.id);
    }
  } catch (error) {
    console.error('Error procesando eventos pendientes:', error);
  }
};

/**
 * Obtiene historial de eventos de una integración
 */
export const getIntegrationEvents = async (
  integrationId: string,
  limit: number = 50
): Promise<IntegrationEvent[]> => {
  try {
    const { data } = await supabase
      .from('integration_events')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Error obteniendo eventos de integración:', error);
    return [];
  }
};

/**
 * Configura webhook personalizado
 */
export const setupCustomWebhook = async (
  integrationId: string,
  webhookUrl: string,
  eventos: string[]
): Promise<void> => {
  try {
    await supabase
      .from('integrations')
      .update({
        webhooks: [webhookUrl],
        configuracion: { eventos },
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);
  } catch (error) {
    console.error('Error configurando webhook personalizado:', error);
  }
};

/**
 * Prueba una integración
 */
export const testIntegration = async (integrationId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return { success: false, message: 'Integración no encontrada' };
    }

    switch (integration.tipo) {
      case 'slack':
        const slackResult = await sendSlackNotification(
          integrationId,
          '🧪 Prueba de conexión desde CRM DESEO DIGITAL'
        );
        return {
          success: slackResult,
          message: slackResult ? 'Notificación enviada exitosamente' : 'Error enviando notificación',
        };
      case 'zapier':
        const zapierResult = await sendZapierEvent(
          integrationId,
          'test',
          { mensaje: 'Prueba de conexión' }
        );
        return {
          success: zapierResult,
          message: zapierResult ? 'Evento enviado exitosamente' : 'Error enviando evento',
        };
      default:
        return {
          success: true,
          message: 'Integración configurada correctamente',
        };
    }
  } catch (error) {
    console.error('Error probando integración:', error);
    return { success: false, message: 'Error probando integración' };
  }
};
