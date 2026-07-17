import { supabase } from './supabase';

export interface DashboardWidget {
  id: string;
  tipo: 'kpi' | 'chart' | 'list' | 'calendar' | 'custom';
  titulo: string;
  posicion: { x: number; y: number };
  tamaño: { w: number; h: number };
  config: any;
  visible: boolean;
}

export interface DashboardLayout {
  id: string;
  nombre: string;
  usuario_id?: string;
  rol?: string;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

/**
 * Widgets predefinidos del dashboard
 */
const WIDGETS_PREDEFINIDOS: DashboardWidget[] = [
  {
    id: 'kpi-clientes',
    tipo: 'kpi',
    titulo: 'Clientes Totales',
    posicion: { x: 0, y: 0 },
    tamaño: { w: 2, h: 1 },
    config: { metrica: 'clientes_totales', color: '#4caf50' },
    visible: true,
  },
  {
    id: 'kpi-proyectos',
    tipo: 'kpi',
    titulo: 'Proyectos Activos',
    posicion: { x: 2, y: 0 },
    tamaño: { w: 2, h: 1 },
    config: { metrica: 'proyectos_activos', color: '#2196f3' },
    visible: true,
  },
  {
    id: 'kpi-ventas',
    tipo: 'kpi',
    titulo: 'Pipeline de Ventas',
    posicion: { x: 4, y: 0 },
    tamaño: { w: 2, h: 1 },
    config: { metrica: 'pipeline_ventas', color: '#ff9800' },
    visible: true,
  },
  {
    id: 'kpi-tareas',
    tipo: 'kpi',
    titulo: 'Tareas Pendientes',
    posicion: { x: 6, y: 0 },
    tamaño: { w: 2, h: 1 },
    config: { metrica: 'tareas_pendientes', color: '#f44336' },
    visible: true,
  },
  {
    id: 'list-proyectos',
    tipo: 'list',
    titulo: 'Proyectos Activos',
    posicion: { x: 0, y: 1 },
    tamaño: { w: 4, h: 2 },
    config: { tipo_lista: 'proyectos_activos', limite: 6 },
    visible: true,
  },
  {
    id: 'list-tareas',
    tipo: 'list',
    titulo: 'Próximas Tareas',
    posicion: { x: 4, y: 1 },
    tamaño: { w: 4, h: 2 },
    config: { tipo_lista: 'proximas_tareas', limite: 5 },
    visible: true,
  },
];

/**
 * Obtiene la configuración del dashboard del usuario
 */
export const getDashboardConfig = async (usuarioId?: string): Promise<DashboardLayout> => {
  try {
    const { data: layout } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('usuario_id', usuarioId || 'default')
      .single();

    if (layout) {
      return layout;
    }

    // Si no existe, crear layout por defecto
    const defaultLayout: Omit<DashboardLayout, 'id' | 'created_at' | 'updated_at'> = {
      nombre: 'Dashboard Principal',
      usuario_id: usuarioId || 'default',
      widgets: WIDGETS_PREDEFINIDOS,
    };

    const { data: createdLayout } = await supabase
      .from('dashboard_layouts')
      .insert({
        ...defaultLayout,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return createdLayout;
  } catch (error) {
    console.error('Error obteniendo dashboard config:', error);
    // Retornar layout por defecto si hay error
    return {
      id: 'default',
      nombre: 'Dashboard Principal',
      widgets: WIDGETS_PREDEFINIDOS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
};

/**
 * Guarda la configuración del dashboard
 */
export const saveDashboardConfig = async (
  layout: DashboardLayout
): Promise<void> => {
  try {
    await supabase
      .from('dashboard_layouts')
      .upsert({
        ...layout,
        updated_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error guardando dashboard config:', error);
  }
};

/**
 * Actualiza la posición de un widget
 */
export const updateWidgetPosition = async (
  layoutId: string,
  widgetId: string,
  posicion: { x: number; y: number }
): Promise<void> => {
  try {
    const { data: layout } = await supabase
      .from('dashboard_layouts')
      .select('widgets')
      .eq('id', layoutId)
      .single();

    if (!layout) return;

    const updatedWidgets = layout.widgets.map((w: DashboardWidget) =>
      w.id === widgetId ? { ...w, posicion } : w
    );

    await supabase
      .from('dashboard_layouts')
      .update({ widgets: updatedWidgets, updated_at: new Date().toISOString() })
      .eq('id', layoutId);
  } catch (error) {
    console.error('Error actualizando widget position:', error);
  }
};

/**
 * Actualiza el tamaño de un widget
 */
export const updateWidgetSize = async (
  layoutId: string,
  widgetId: string,
  tamaño: { w: number; h: number }
): Promise<void> => {
  try {
    const { data: layout } = await supabase
      .from('dashboard_layouts')
      .select('widgets')
      .eq('id', layoutId)
      .single();

    if (!layout) return;

    const updatedWidgets = layout.widgets.map((w: DashboardWidget) =>
      w.id === widgetId ? { ...w, tamaño } : w
    );

    await supabase
      .from('dashboard_layouts')
      .update({ widgets: updatedWidgets, updated_at: new Date().toISOString() })
      .eq('id', layoutId);
  } catch (error) {
    console.error('Error actualizando widget size:', error);
  }
};

/**
 * Alterna la visibilidad de un widget
 */
export const toggleWidgetVisibility = async (
  layoutId: string,
  widgetId: string
): Promise<void> => {
  try {
    const { data: layout } = await supabase
      .from('dashboard_layouts')
      .select('widgets')
      .eq('id', layoutId)
      .single();

    if (!layout) return;

    const updatedWidgets = layout.widgets.map((w: DashboardWidget) =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );

    await supabase
      .from('dashboard_layouts')
      .update({ widgets: updatedWidgets, updated_at: new Date().toISOString() })
      .eq('id', layoutId);
  } catch (error) {
    console.error('Error toggling widget visibility:', error);
  }
};

/**
 * Agrega un nuevo widget al dashboard
 */
export const addWidget = async (
  layoutId: string,
  widget: Omit<DashboardWidget, 'id'>
): Promise<void> => {
  try {
    const { data: layout } = await supabase
      .from('dashboard_layouts')
      .select('widgets')
      .eq('id', layoutId)
      .single();

    if (!layout) return;

    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${crypto.randomUUID()}`,
    };

    const updatedWidgets = [...layout.widgets, newWidget];

    await supabase
      .from('dashboard_layouts')
      .update({ widgets: updatedWidgets, updated_at: new Date().toISOString() })
      .eq('id', layoutId);
  } catch (error) {
    console.error('Error adding widget:', error);
  }
};

/**
 * Elimina un widget del dashboard
 */
export const removeWidget = async (
  layoutId: string,
  widgetId: string
): Promise<void> => {
  try {
    const { data: layout } = await supabase
      .from('dashboard_layouts')
      .select('widgets')
      .eq('id', layoutId)
      .single();

    if (!layout) return;

    const updatedWidgets = layout.widgets.filter((w: DashboardWidget) => w.id !== widgetId);

    await supabase
      .from('dashboard_layouts')
      .update({ widgets: updatedWidgets, updated_at: new Date().toISOString() })
      .eq('id', layoutId);
  } catch (error) {
    console.error('Error removing widget:', error);
  }
};

/**
 * Restablece el dashboard a la configuración por defecto
 */
export const resetDashboard = async (layoutId: string): Promise<void> => {
  try {
    await supabase
      .from('dashboard_layouts')
      .update({ 
        widgets: WIDGETS_PREDEFINIDOS,
        updated_at: new Date().toISOString()
      })
      .eq('id', layoutId);
  } catch (error) {
    console.error('Error resetting dashboard:', error);
  }
};
