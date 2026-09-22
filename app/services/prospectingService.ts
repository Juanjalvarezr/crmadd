import { supabase } from './supabase';
import type { Prospecto, EstadoProspecto } from '../types/crm';

export const prospectingService = {
  async getAll(): Promise<Prospecto[]> {
    const { data, error } = await supabase
      .from('prospecting_pipeline')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToProspecto);
  },

  async getById(id: number): Promise<Prospecto | null> {
    const { data, error } = await supabase
      .from('prospecting_pipeline')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data ? mapDBToProspecto(data) : null;
  },

  async getByEstado(estado: EstadoProspecto): Promise<Prospecto[]> {
    const { data, error } = await supabase
      .from('prospecting_pipeline')
      .select('*')
      .eq('estado', estado)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToProspecto);
  },

  async getListosContactar(): Promise<Prospecto[]> {
    const { data, error } = await supabase
      .from('prospecting_pipeline')
      .select('*')
      .eq('listo_contactar', true)
      .eq('es_prospecto', true)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToProspecto);
  },

  async create(prospecto: Partial<Prospecto>): Promise<Prospecto | null> {
    const { data, error } = await supabase
      .from('prospecting_pipeline')
      .insert([mapProspectoToDB(prospecto)])
      .select()
      .single();
    if (error) throw error;
    return mapDBToProspecto(data);
  },

  async update(id: number, updates: Partial<Prospecto>): Promise<Prospecto | null> {
    const { data, error } = await supabase
      .from('prospecting_pipeline')
      .update(mapProspectoToDB(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDBToProspecto(data);
  },

  async updateEstado(id: number, estado: EstadoProspecto): Promise<Prospecto | null> {
    return this.update(id, { estado });
  },

  async toggleListoContactar(id: number, listo: boolean): Promise<Prospecto | null> {
    return this.update(id, { listo_contactar: listo });
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('prospecting_pipeline').delete().eq('id', id);
    if (error) throw error;
  },
};

function mapDBToProspecto(p: any): Prospecto {
  return {
    id: p.id,
    codigo: p.codigo || '',
    nombre: p.nombre,
    tipo_negocio: p.tipo_negocio,
    descripcion: p.descripcion,
    telefono: p.telefono,
    email: p.email,
    direccion: p.direccion,
    ubicacion: p.ubicacion,
    origen: p.origen,
    fecha_extraccion: p.fecha_extraccion,
    estado: p.estado || 'Nuevo',
    fecha_visita: p.fecha_visita,
    fecha_cita: p.fecha_cita,
    notas_visita: p.notas_visita,
    necesidades: p.necesidades,
    solucion_propuesta: p.solucion_propuesta,
    servicios: p.servicios,
    precio_estimado: p.precio_estimado,
    proximo_contacto: p.proximo_contacto,
    ultima_interaccion: p.ultima_interaccion,
    es_prospecto: p.es_prospecto ?? true,
    listo_contactar: p.listo_contactar ?? false,
    canal_preferido: p.canal_preferido || 'WhatsApp',
    creado_en: p.creado_en,
  };
}

function mapProspectoToDB(p: Partial<Prospecto>): any {
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    tipo_negocio: p.tipo_negocio,
    descripcion: p.descripcion,
    telefono: p.telefono,
    email: p.email,
    direccion: p.direccion,
    ubicacion: p.ubicacion,
    origen: p.origen,
    fecha_extraccion: p.fecha_extraccion,
    estado: p.estado || 'Nuevo',
    fecha_visita: p.fecha_visita,
    fecha_cita: p.fecha_cita,
    notas_visita: p.notas_visita,
    necesidades: p.necesidades,
    solucion_propuesta: p.solucion_propuesta,
    servicios: p.servicios,
    precio_estimado: p.precio_estimado,
    proximo_contacto: p.proximo_contacto,
    ultima_interaccion: p.ultima_interaccion,
    es_prospecto: p.es_prospecto ?? true,
    listo_contactar: p.listo_contactar ?? false,
    canal_preferido: p.canal_preferido || 'WhatsApp',
  };
}
