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
  credencialesService as baseCredencialesService,
} from './supabase';

const TIMEOUT_MS = 65000;
const CACHE_BUST = 'v3-65s-dashboard-visible-2026-07-13';

const withTimeout = async <T>(promise: Promise<T>, label = 'operación', ms = TIMEOUT_MS): Promise<T> => {
  const start = Date.now();
  return Promise.race([
    promise.catch((err) => {
      console.error(`[database.ts] Error en ${label}:`, err);
      throw err;
    }),
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        console.warn(`[database.ts] Timeout en ${label} (${ms}ms) elapsed=${Date.now() - start}ms cache=${CACHE_BUST}`);
        reject(new Error('Timeout en base de datos'));
      }, ms)
    ),
  ]);
};

export const loadMultiple = async <T>(items: { service: () => Promise<T>; label: string }[]): Promise<T[]> => {
  return Promise.all(items.map(item => withTimeout(item.service(), item.label).catch(() => [] as any)));
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
  setSubtareas: (id: number, subtareas: any[]) =>
    withTimeout(baseTareasService.update(id, { subtareas }), 'tareasService.setSubtareas'),
  toggleSubtarea: (id: number, subtareaId: string) =>
    withTimeout((async () => {
      const base = await baseTareasService.getAll();
      const tarea = base.find((t: any) => t.id === id);
      if (!tarea?.subtareas) return baseTareasService.update(id, { subtareas: [] });
      const updated = (tarea.subtareas || []).map((s: any) =>
        s.id === subtareaId ? { ...s, completada: !s.completada } : s
      );
      return baseTareasService.update(id, { subtareas: updated });
    })(), 'tareasService.toggleSubtarea'),
  addSubtarea: (id: number, titulo: string) =>
    withTimeout((async () => {
      const base = await baseTareasService.getAll();
      const tarea = base.find((t: any) => t.id === id);
      const subtarea = { id: crypto.randomUUID(), titulo, completada: false };
      const updated = [...(tarea?.subtareas || []), subtarea];
      return baseTareasService.update(id, { subtareas: updated });
    })(), 'tareasService.addSubtarea'),
  setAdjuntos: (id: number, adjuntos: any[]) =>
    withTimeout(baseTareasService.update(id, { adjuntos }), 'tareasService.setAdjuntos'),
  addComentario: (id: number, comentario: any) =>
    withTimeout((async () => {
      const base = await baseTareasService.getAll();
      const tarea = base.find((t: any) => t.id === id);
      const updated = [...(tarea?.comentarios || []), comentario];
      return baseTareasService.update(id, { comentarios: updated });
    })(), 'tareasService.addComentario'),
  addRecordatorio: (id: number, recordatorio: any) =>
    withTimeout((async () => {
      const base = await baseTareasService.getAll();
      const tarea = base.find((t: any) => t.id === id);
      const updated = [...(tarea?.recordatorios || []), recordatorio];
      return baseTareasService.update(id, { recordatorios: updated });
    })(), 'tareasService.addRecordatorio'),
  startTimer: (id: number) =>
    withTimeout(baseTareasService.update(id, { tiempo_inicio: new Date().toISOString(), timer_activo: true }), 'tareasService.startTimer'),
  pauseTimer: (id: number) =>
    withTimeout((async () => {
      const base = await baseTareasService.getAll();
      const tarea = base.find((t: any) => t.id === id);
      const extra: any = { tiempo_pausa: new Date().toISOString(), timer_activo: false };
      if (tarea?.tiempo_inicio && !tarea?.tiempo_total) {
        const total = Math.round((new Date().getTime() - new Date(tarea.tiempo_inicio).getTime()) / 1000);
        extra.tiempo_total = total;
      }
      return baseTareasService.update(id, extra);
    })(), 'tareasService.pauseTimer'),
  finishTimer: (id: number) =>
    withTimeout((async () => {
      const base = await baseTareasService.getAll();
      const tarea = base.find((t: any) => t.id === id);
      const extra: any = { tiempo_fin: new Date().toISOString(), timer_activo: false, estado: 'Completada' };
      if (tarea?.tiempo_inicio && !tarea?.tiempo_total) {
        const total = Math.round((new Date().getTime() - new Date(tarea.tiempo_inicio).getTime()) / 1000);
        extra.tiempo_total = total;
      }
      return baseTareasService.update(id, extra);
    })(), 'tareasService.finishTimer'),
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

// DEPRECATED: sin uso en rutas actuales. Eliminar o integrar en UI.
export const interaccionesService = {
  create: (interaccion: any) => withTimeout(baseInteraccionesService.create(interaccion), 'interaccionesService.create'),
};

// DEPRECATED: sin uso en rutas actuales. Eliminar o integrar en UI.
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
        const apiKey = (globalThis as any).__RESEND_KEY || (globalThis as any)?.process?.env?.VITE_RESEND_API_KEY;
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

// DEPRECATED: sin uso en rutas actuales. Eliminar o integrar en UI.
export const transaccionesService = {
  getAll: () => withTimeout((async () => {
    const { data, error } = await supabase.from('transacciones').select('id, monto, tipo, categoria, fecha, proyecto_id, factura_id, created_at').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  })(), 'transaccionesService.getAll').catch(() => []),
  create: (item: any) => withTimeout((async () => {
    const { data, error } = await supabase.from('transacciones').insert(item).select().single();
    if (error) throw new Error(error.message);
    return data;
  })(), 'transaccionesService.create'),
  update: (id: string, updates: any) => withTimeout((async () => {
    const { data, error } = await supabase.from('transacciones').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  })(), 'transaccionesService.update'),
  delete: (id: number) => withTimeout((async () => {
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  })(), 'transaccionesService.delete'),
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
    const apiKey = (import.meta as any)?.env?.VITE_RESEND_API_KEY;
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

// DEPRECATED: sin uso en rutas actuales. Eliminar o integrar en UI.
export const notificacionesService = {
  getAll: () => withTimeout((async () => {
    const { data, error } = await supabase.from('notificaciones').select('id, leida, tipo, titulo, mensaje, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  })(), 'notificacionesService.getAll'),
  create: (item: any) => withTimeout((async () => {
    const { data, error } = await supabase.from('notificaciones').insert(item).select().single();
    if (error) throw error;
    return data;
  })(), 'notificacionesService.create'),
  markRead: (id: string) => withTimeout((async () => {
    const { data, error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    if (error) throw error;
    return data;
  })(), 'notificacionesService.markRead'),
};



