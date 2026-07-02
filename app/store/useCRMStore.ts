import { create } from 'zustand';
import { clientesService, proyectosService, oportunidadesService } from '../services/database';

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
      const [clientes, oportunidades, proyectos] = await Promise.all([
        clientesService.getAll(),
        oportunidadesService.getAll(),
        proyectosService.getAll(),
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
