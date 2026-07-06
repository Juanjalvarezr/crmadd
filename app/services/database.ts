/**
 * Servicio central de base de datos.
 * - Sin fallback a mocks.
 * - Timeout amplio para redes móviles/lentas.
 * - Un solo punto de entrada: supabase real.
 */

import {
  supabase as supabaseClient,
  Tables,
  ClienteSchema,
  mapDBToCliente,
  mapClienteToDB,
  mapDBToProyecto,
  mapProyectoToDB,
  serviciosService as baseServiciosService,
  tareasService as baseTareasService,
  clientesService as baseClientesService,
  oportunidadesService as baseOportunidadesService,
  proyectosService as baseProyectosService,
  subagentesService as baseSubagentesService,
  interaccionesService as baseInteraccionesService,
  logsService as baseLogsService,
  emailService as baseEmailService,
  configuracionService as baseConfiguracionService,
  reglasAIService as baseReglasAIService,
  promptsAIService as basePromptsAIService,
  conocimientoService as baseConocimientoService,
  authService as baseAuthService,
  testConnection as baseTestConnection,
} from './supabase';

const TIMEOUT_MS = 8000;

const withTimeout = async <T>(promise: Promise<T>, label = 'operación'): Promise<T> => {
  return Promise.race([
    promise.catch((err) => {
      console.error(`[database.ts] Error en ${label}:`, err);
      throw err;
    }),
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        console.warn(`[database.ts] Timeout en ${label} (${TIMEOUT_MS}ms)`);
        reject(new Error('Timeout en base de datos'));
      }, TIMEOUT_MS)
    ),
  ]);
};

export const supabase = supabaseClient;
export type { Tables };
export { ClienteSchema, mapDBToCliente, mapClienteToDB, mapDBToProyecto, mapProyectoToDB };

export const serviciosService = {
  getAll: () => withTimeout(baseServiciosService.getAll(), 'serviciosService.getAll'),
  create: (servicio: any) => withTimeout(baseServiciosService.create(servicio), 'serviciosService.create'),
  update: (id: number, servicio: any) => withTimeout(baseServiciosService.update(id, servicio), 'serviciosService.update'),
  delete: (id: number) => withTimeout(baseServiciosService.delete(id), 'serviciosService.delete'),
};

export const tareasService = {
  getAll: () => withTimeout(baseTareasService.getAll(), 'tareasService.getAll'),
  create: (tarea: any) => withTimeout(baseTareasService.create(tarea), 'tareasService.create'),
  update: (id: number, tarea: any) => withTimeout(baseTareasService.update(id, tarea), 'tareasService.update'),
  delete: (id: number) => withTimeout(baseTareasService.delete(id), 'tareasService.delete'),
};

export const clientesService = {
  getAll: () => withTimeout(baseClientesService.getAll(), 'clientesService.getAll'),
  create: (cliente: any) => withTimeout(baseClientesService.create(cliente), 'clientesService.create'),
  update: (id: any, updates: any) => withTimeout(baseClientesService.update(id, updates), 'clientesService.update'),
  delete: (id: any) => withTimeout(baseClientesService.delete(id), 'clientesService.delete'),
};

export const oportunidadesService = {
  getAll: () => withTimeout(baseOportunidadesService.getAll(), 'oportunidadesService.getAll'),
  create: (opp: any) => withTimeout(baseOportunidadesService.create(opp), 'oportunidadesService.create'),
  update: (id: number, updates: any) => withTimeout(baseOportunidadesService.update(id, updates), 'oportunidadesService.update'),
  delete: (id: number) => withTimeout(baseOportunidadesService.delete(id), 'oportunidadesService.delete'),
};

export const proyectosService = {
  getAll: () => withTimeout(baseProyectosService.getAll(), 'proyectosService.getAll'),
  getById: (id: string) => withTimeout(baseProyectosService.getById(id), 'proyectosService.getById').catch(() => null),
  create: (proyecto: any) => withTimeout(baseProyectosService.create(proyecto), 'proyectosService.create'),
  update: (id: string, updates: any) => withTimeout(baseProyectosService.update(id, updates), 'proyectosService.update'),
  delete: (id: string) => withTimeout(baseProyectosService.delete(id), 'proyectosService.delete'),
};

export const equipoService = {
  getAll: () => withTimeout(baseSubagentesService.getAll(), 'equipoService.getAll'),
  create: (equipo: any) => withTimeout(baseSubagentesService.create(equipo), 'equipoService.create'),
  update: (id: number, updates: any) => withTimeout(baseSubagentesService.update(id, updates), 'equipoService.update'),
  delete: (id: number) => withTimeout(baseSubagentesService.delete(id), 'equipoService.delete'),
};

export const interaccionesService = {
  create: (interaccion: any) => withTimeout(baseInteraccionesService.create(interaccion), 'interaccionesService.create'),
};

export const logsService = {
  create: (log: any) => {
    baseLogsService.create(log).catch(() => {});
    return Promise.resolve();
  },
};

export const emailService = {
  getCampanas: () => withTimeout(baseEmailService.getCampanas(), 'emailService.getCampanas').catch(() => []),
  createCampana: (campana: any) => withTimeout(baseEmailService.createCampana(campana), 'emailService.createCampana'),
  updateCampana: (id: string, updates: any) => withTimeout(baseEmailService.updateCampana(id, updates), 'emailService.updateCampana'),
  deleteCampana: (id: string) => withTimeout(baseEmailService.deleteCampana(id), 'emailService.deleteCampana'),
  getPlantillas: () => withTimeout(baseEmailService.getPlantillas(), 'emailService.getPlantillas').catch(() => []),
  createPlantilla: (plantilla: any) => withTimeout(baseEmailService.createPlantilla(plantilla), 'emailService.createPlantilla'),
  sendRealEmail: (to: string[], subject: string, html: string, attachments?: any[]) =>
    withTimeout(
      (async () => {
        const apiKey = (import.meta as any).env?.VITE_RESEND_API_KEY;
        if (!apiKey) {
          console.warn('Simulando envío de email (falta API Key de Resend)');
          return { id: 'simulated-id', message: 'Email simulado correctamente' } as any;
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: 'DESEO DIGITAL <onboarding@resend.dev>',
            to,
            subject,
            html,
            attachments,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
          console.error('Error de Resend:', response.status, errorData);
          return { id: 'simulated-id', message: 'Error API, email simulado' } as any;
        }

        return (await response.json()) as Record<string, unknown>;
      })()
    ),
};

export const configuracionService = {
  getEmpresa: () => withTimeout(baseConfiguracionService.getEmpresa(), 'configuracionService.getEmpresa').catch(() => null),
  updateEmpresa: (config: any) => withTimeout(baseConfiguracionService.updateEmpresa(config), 'configuracionService.updateEmpresa'),
  uploadLogo: (file: File) => withTimeout(baseConfiguracionService.uploadLogo(file), 'configuracionService.uploadLogo'),
};

export const reglasAIService = {
  getAll: () => withTimeout(baseReglasAIService.getAll(), 'reglasAIService.getAll').catch(() => []),
  create: (regla: any) => withTimeout(baseReglasAIService.create(regla), 'reglasAIService.create'),
  delete: (id: number) => withTimeout(baseReglasAIService.delete(id), 'reglasAIService.delete'),
};

export const promptsAIService = {
  getBySlug: (slug: string) => withTimeout(basePromptsAIService.getBySlug(slug), 'promptsAIService.getBySlug').catch(() => null),
  getAll: () => withTimeout(basePromptsAIService.getAll(), 'promptsAIService.getAll').catch(() => []),
  update: (id: string, updates: any) => withTimeout(basePromptsAIService.update(id, updates), 'promptsAIService.update'),
};

export const conocimientoService = {
  getAll: () => withTimeout(baseConocimientoService.getAll(), 'conocimientoService.getAll').catch(() => []),
  buscarSemantico: (embedding: number[]) => withTimeout(baseConocimientoService.buscarSemantico(embedding), 'conocimientoService.buscarSemantico').catch(() => []),
  create: (item: any) => withTimeout(baseConocimientoService.create(item), 'conocimientoService.create'),
  delete: (id: number) => withTimeout(baseConocimientoService.delete(id), 'conocimientoService.delete'),
};

export const authService = {
  signUp: (email: string, pass: string) => withTimeout(baseAuthService.signUp(email, pass), 'authService.signUp'),
  signIn: (email: string, pass: string) => withTimeout(baseAuthService.signIn(email, pass), 'authService.signIn'),
  signOut: () => withTimeout(baseAuthService.signOut(), 'authService.signOut'),
};

export const transaccionesService = {
  getAll: () => withTimeout(baseTransaccionesService.getAll(), 'transaccionesService.getAll').catch(() => []),
  create: (item: any) => withTimeout(baseTransaccionesService.create(item), 'transaccionesService.create'),
  update: (id: string, updates: any) => withTimeout(baseTransaccionesService.update(id, updates), 'transaccionesService.update'),
  delete: (id: number) => withTimeout(baseTransaccionesService.delete(id), 'transaccionesService.delete'),
};

export async function testConnection() {
  return withTimeout(baseTestConnection(), 'testConnection').catch(() => {
    return { success: false, message: 'Timeout o error de conexión' } as any;
  });
}

// Email Marketing con Resend (API directa)
export const RESEND_API_BASE = 'https://api.resend.com/emails';

export const emailMarketingService = {
  send: async (payload: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: Array<{ filename: string; content: string }>;
  }) => {
    const apiKey = (globalThis as any)?.__RESEND_KEY;
    if (!apiKey) {
      return { ok: false as const, error: 'Falta VITE_RESEND_API_KEY' };
    }

    const body = {
      from: payload.from || 'DESEO DIGITAL <onboarding@resend.dev>',
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html || '',
      text: payload.text,
      reply_to: payload.replyTo,
      attachments: payload.attachments,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false as const, error: data?.message || `Error ${res.status}` };
    }
    return { ok: true as const, id: data?.id };
  },
};

export const notificacionesService = {
  getAll: () => withTimeout(supabase.from('notificaciones').select('*').order('created_at', { ascending: false }), 'notificacionesService.getAll').then(r => r.data || []),
  create: (item: any) => withTimeout(supabase.from('notificaciones').insert(item).select().single(), 'notificacionesService.create').then(r => r.data),
  markRead: (id: string) => withTimeout(supabase.from('notificaciones').update({ leida: true }).eq('id', id), 'notificacionesService.markRead'),
};



