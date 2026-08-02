import { create } from 'zustand';
import { clientesService, proyectosService, oportunidadesService, tareasService } from '../services/database';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface CRMState {
  clientes: any[];
  oportunidades: any[];
  proyectos: any[];
  tareas: any[];
  facturas: any[];
  transacciones: any[];
  contratos: any[];
  notifications: Notification[];
  stats: {
    totalIngresos: number;
    clientesActivos: number;
    tasaConversion: number;
    proyectosActivos: number;
  };
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchDashboardData: () => Promise<void>;
  fetchClientes: () => Promise<void>;
  fetchProyectos: () => Promise<void>;
  fetchTareas: () => Promise<void>;
  fetchFacturas: () => Promise<void>;
  fetchTransacciones: () => Promise<void>;
  fetchContratos: () => Promise<void>;
  updateStats: () => void;
  addCliente: (cliente: any) => void;
  updateCliente: (id: number, data: any) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
  clientes: [],
  oportunidades: [],
  proyectos: [],
  tareas: [],
  facturas: [],
  transacciones: [],
  contratos: [],
  notifications: [
    {
      id: '1',
      type: 'info',
      title: 'Bienvenido',
      message: 'DESEO DIGITAL está listo para hoy.',
      time: 'Ahora',
      read: false,
    },
  ],
  stats: {
    totalIngresos: 0,
    clientesActivos: 0,
    tasaConversion: 0,
    proyectosActivos: 0,
  },
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [clientes, oportunidades, proyectos, tareas] = await Promise.all([
        clientesService.getAll().catch(() => []),
        oportunidadesService.getAll().catch(() => []),
        proyectosService.getAll().catch(() => []),
        tareasService.getAll().catch(() => []),
      ]);

      const totalIngresos = oportunidades.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);
      const clientesActivos = clientes.filter((c: any) => c.estado === 'Activo').length;
      const oportunidadesCompletadas = oportunidades.filter((o: any) => o.etapa === 'Cierre' || o.estado === 'Cerrada').length;
      const tasaConversion = oportunidades.length > 0
        ? Math.round((oportunidadesCompletadas / oportunidades.length) * 100 * 10) / 10
        : 0;
      const proyectosActivos = proyectos.filter((p: any) => p.estado === 'en_progreso' || p.estado === 'planificacion').length;

      set({
        clientes,
        oportunidades,
        proyectos,
        tareas,
        stats: {
          totalIngresos,
          clientesActivos,
          tasaConversion,
          proyectosActivos,
        },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchClientes: async () => {
    set({ isLoading: true, error: null });
    try {
      const clientes = await clientesService.getAll();
      set({ clientes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchProyectos: async () => {
    set({ isLoading: true, error: null });
    try {
      const proyectos = await proyectosService.getAll();
      set({ proyectos, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTareas: async () => {
    set({ isLoading: true, error: null });
    try {
      const tareas = await tareasService.getAll();
      set({ tareas, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchFacturas: async () => {
    // Facturas service missing, empty stub for now
    set({ isLoading: false, facturas: [] });
  },

  fetchTransacciones: async () => {
    set({ isLoading: false, transacciones: [] });
  },

  fetchContratos: async () => {
    set({ isLoading: false, contratos: [] });
  },

  updateStats: () => {
    const { clientes, oportunidades, proyectos } = get();
    const totalIngresos = oportunidades.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);
    const clientesActivos = clientes.filter((c: any) => c.estado === 'Activo').length;
    const oportunidadesCompletadas = oportunidades.filter((o: any) => o.etapa === 'Cierre' || o.estado === 'Cerrada').length;
    const tasaConversion = oportunidades.length > 0
      ? Math.round((oportunidadesCompletadas / oportunidades.length) * 100 * 10) / 10
      : 0;
    const proyectosActivos = proyectos.filter((p: any) => p.estado === 'en_progreso' || p.estado === 'planificacion').length;
    set({ stats: { totalIngresos, clientesActivos, tasaConversion, proyectosActivos } });
  },

  addCliente: (cliente) => set((state) => ({ clientes: [cliente, ...state.clientes] })),
  updateCliente: (id, data) => set((state) => ({
    clientes: state.clientes.map(c => c.id === id ? { ...c, ...data } : c)
  })),
  addNotification: (notif) => set((state) => ({
    notifications: [
      {
        ...notif,
        id: Math.random().toString(36).substr(2, 9),
        read: false,
        time: 'Ahora',
      },
      ...state.notifications,
    ],
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
