import {
  supabase as supabaseClient,
  Tables,
  ClienteSchema,
  serviciosService as baseServiciosService,
  tareasService as baseTareasService,
  clientesService as baseClientesService,
  oportunidadesService as baseOportunidadesService,
  proyectosService as baseProyectosService,
  subagentesService as baseSubagentesService,
  interaccionesService as baseInteraccionesService,
  logsService as baseLogsService,
  configuracionService as baseConfiguracionService,
  reglasAIService as baseReglasAIService,
  promptsAIService as basePromptsAIService,
  conocimientoService as baseConocimientoService,
  authService as baseAuthService,
  testConnection as baseTestConnection,
  facturasService as baseFacturasService,
  contratosService as baseContratosService,
} from './supabase';

export const supabase = supabaseClient;
export type { Tables };
export { ClienteSchema };

const TIMEOUT_MS = 20000;

const withTimeout = async <T>(promise: Promise<T>, _label = 'operación'): Promise<T> => {
  return Promise.race([
    promise.catch((err) => { throw err; }),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout en base de datos')), TIMEOUT_MS)
    ),
  ]);
};

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
  update: (id: number, updates: any) => withTimeout(baseClientesService.update(id, updates), 'clientesService.update'),
  delete: (id: number) => withTimeout(baseClientesService.delete(id), 'clientesService.delete'),
};

export const oportunidadesService = {
  getAll: () => withTimeout(baseOportunidadesService.getAll(), 'oportunidadesService.getAll'),
  create: (opp: any) => withTimeout(baseOportunidadesService.create(opp), 'oportunidadesService.create'),
  update: (id: number, updates: any) => withTimeout(baseOportunidadesService.update(id, updates), 'oportunidadesService.update'),
  delete: (id: number) => withTimeout(baseOportunidadesService.delete(id), 'oportunidadesService.delete'),
};

export const proyectosService = {
  getAll: () => withTimeout(baseProyectosService.getAll(), 'proyectosService.getAll'),
  create: (proyecto: any) => withTimeout(baseProyectosService.create(proyecto), 'proyectosService.create'),
  update: (id: string, updates: any) => withTimeout(baseProyectosService.update(id, updates), 'proyectosService.update'),
  delete: (id: string) => withTimeout(baseProyectosService.delete(id), 'proyectosService.delete'),
};

export const equipoService = {
  getAll: () => withTimeout(baseSubagentesService.getAll(), 'equipoService.getAll'),
  create: (agente: any) => withTimeout(baseSubagentesService.create(agente), 'equipoService.create'),
  update: (id: number, updates: any) => withTimeout(baseSubagentesService.update(id, updates), 'equipoService.update'),
  delete: (id: number) => withTimeout(baseSubagentesService.delete(id), 'equipoService.delete'),
};

export const interaccionesService = {
  create: (interaccion: any) => withTimeout(baseInteraccionesService.create(interaccion), 'interaccionesService.create'),
};

export const logsService = {
  create: (log: any) => withTimeout(baseLogsService.create(log), 'logsService.create'),
};

export const configuracionService = baseConfiguracionService;
export const reglasAIService = baseReglasAIService;
export const promptsAIService = basePromptsAIService;
export const conocimientoService = baseConocimientoService;

export const authService = {
  login: (credentials: any) => withTimeout(baseAuthService.signIn(credentials.email, credentials.password), 'authService.login'),
  logout: () => withTimeout(baseAuthService.signOut(), 'authService.logout'),
  session: async () => {
    try {
      const { data } = await supabaseClient.auth.getUser();
      return data.user ?? null;
    } catch (err: any) {
      return Promise.reject(err);
    }
  },
};

export async function testConnection() {
  return withTimeout(baseTestConnection(), 'testConnection');
}

export const facturasService = {
  getAll: () => withTimeout(baseFacturasService.getAll(), 'facturasService.getAll'),
  create: (factura: any) => withTimeout(baseFacturasService.create(factura), 'facturasService.create'),
  update: (id: number, updates: any) => withTimeout(baseFacturasService.update(id, updates), 'facturasService.update'),
  delete: (id: number) => withTimeout(baseFacturasService.delete(id), 'facturasService.delete'),
};

export const contratosService = {
  getAll: () => withTimeout(baseContratosService.getAll(), 'contratosService.getAll'),
  create: (contrato: any) => withTimeout(baseContratosService.create(contrato), 'contratosService.create'),
  update: (id: number, updates: any) => withTimeout(baseContratosService.update(id, updates), 'contratosService.update'),
  delete: (id: number) => withTimeout(baseContratosService.delete(id), 'contratosService.delete'),
};
