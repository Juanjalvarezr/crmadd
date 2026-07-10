// Servicio de Oportunidades para DESEO DIGITAL CRM
import { supabase } from './supabase';
import type { Oportunidad } from '../types/crm';

export type OportunidadInput = Omit<Oportunidad, 'id' | 'created_at'>;

export const oportunidadesService = {
  /**
   * Obtiene todas las oportunidades de la base de datos
   * @returns Promise<Oportunidad[]> Lista de oportunidades
   */
  getAll: async (): Promise<Oportunidad[]> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Oportunidad[];
    } catch (error) {
      console.error('Error al obtener oportunidades:', error);
      throw error;
    }
  },

  /**
   * Obtiene una oportunidad por su ID
   * @param id ID de la oportunidad
   * @returns Promise<Oportunidad | null> Oportunidad encontrada o null
   */
  getById: async (id: number): Promise<Oportunidad | null> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Oportunidad;
    } catch (error) {
      console.error('Error al obtener oportunidad:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva oportunidad
   * @param oportunidad Datos de la oportunidad a crear
   * @returns Promise<Oportunidad> Oportunidad creada
   */
  create: async (oportunidad: OportunidadInput): Promise<Oportunidad> => {
    try {
      const oportunidadConTimestamp = {
        ...oportunidad,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('oportunidades')
        .insert(oportunidadConTimestamp)
        .select()
        .single();

      if (error) throw error;
      return data as Oportunidad;
    } catch (error) {
      console.error('Error al crear oportunidad:', error);
      throw error;
    }
  },

  /**
   * Actualiza una oportunidad existente
   * @param id ID de la oportunidad a actualizar
   * @param datos Datos a actualizar
   * @returns Promise<Oportunidad> Oportunidad actualizada
   */
  update: async (id: number, datos: Partial<OportunidadInput>): Promise<Oportunidad> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Oportunidad;
    } catch (error) {
      console.error('Error al actualizar oportunidad:', error);
      throw error;
    }
  },

  /**
   * Elimina una oportunidad
   * @param id ID de la oportunidad a eliminar
   * @returns Promise<void>
   */
  delete: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('oportunidades')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error al eliminar oportunidad:', error);
      throw error;
    }
  },

  /**
   * Busca oportunidades por término de búsqueda
   * @param query Término de búsqueda
   * @returns Promise<Oportunidad[]> Lista de oportunidades que coinciden
   */
  search: async (query: string): Promise<Oportunidad[]> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .or(`nombre.ilike.%${query}%,cliente_nombre.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Oportunidad[];
    } catch (error) {
      console.error('Error al buscar oportunidades:', error);
      throw error;
    }
  },

  /**
   * Obtiene oportunidades por etapa
   * @param etapa Etapa de la oportunidad
   * @returns Promise<Oportunidad[]> Lista de oportunidades en la etapa especificada
   */
  getByEtapa: async (etapa: string): Promise<Oportunidad[]> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .eq('etapa', etapa)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Oportunidad[];
    } catch (error) {
      console.error('Error al obtener oportunidades por etapa:', error);
      throw error;
    }
  },

  /**
   * Obtiene oportunidades por cliente
   * @param clienteId ID del cliente
   * @returns Promise<Oportunidad[]> Lista de oportunidades del cliente
   */
  getByCliente: async (clienteId: number): Promise<Oportunidad[]> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Oportunidad[];
    } catch (error) {
      console.error('Error al obtener oportunidades por cliente:', error);
      throw error;
    }
  },

  /**
   * Obtiene oportunidades cerradas (en etapa Cierre)
   * @returns Promise<Oportunidad[]> Lista de oportunidades cerradas
   */
  getCerradas: async (): Promise<Oportunidad[]> => {
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .select('*')
        .eq('etapa', 'Cierre')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Oportunidad[];
    } catch (error) {
      console.error('Error al obtener oportunidades cerradas:', error);
      throw error;
    }
  },

  /**
   * Calcula estadísticas de oportunidades
   * @returns Promise<{total: number, valorTotal: number, cerradas: number, tasaConversion: number}>
   */
async function getEstadisticas(): Promise<{ total: number; valorTotal: number; cerradas: number; tasaConversion: number }> {
  try {
    const { data, error } = await supabase.from('oportunidades').select('*');
    if (error) throw error;
    const oportunidades = data || [];
    if (!oportunidades.length) return { total: 0, valorTotal: 0, cerradas: 0, tasaConversion: 0 };
    const total = oportunidades.length;
    const valorTotal = oportunidades.reduce((acc: number, opp: any) => acc + (opp.valor || 0), 0);
    const cerradas = oportunidades.filter((opp: any) => opp.etapa === 'Cierre').length;
    const tasaConversion = total > 0 ? Math.round((cerradas / total) * 100) : 0;
    return { total, valorTotal, cerradas, tasaConversion };
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    throw error;
  }
}

