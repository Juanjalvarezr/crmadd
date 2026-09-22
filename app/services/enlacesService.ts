import { supabase } from './supabase';
import type { EnlaceDocumento } from '../types/crm';

export const enlacesService = {
  async getAll(): Promise<EnlaceDocumento[]> {
    const { data, error } = await supabase
      .from('enlaces_documentos')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToEnlace);
  },

  async getByProspectoId(prospectoId: number): Promise<EnlaceDocumento[]> {
    const { data, error } = await supabase
      .from('enlaces_documentos')
      .select('*')
      .eq('prospecto_id', prospectoId)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToEnlace);
  },

  async getByClienteId(clienteId: number): Promise<EnlaceDocumento[]> {
    const { data, error } = await supabase
      .from('enlaces_documentos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDBToEnlace);
  },

  async create(enlace: Partial<EnlaceDocumento>): Promise<EnlaceDocumento | null> {
    const { data, error } = await supabase
      .from('enlaces_documentos')
      .insert([mapEnlaceToDB(enlace)])
      .select()
      .single();
    if (error) throw error;
    return mapDBToEnlace(data);
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('enlaces_documentos').delete().eq('id', id);
    if (error) throw error;
  },
};

function mapDBToEnlace(e: any): EnlaceDocumento {
  return {
    id: e.id,
    titulo: e.titulo,
    url: e.url,
    tipo_documento: e.tipo_documento,
    prospecto_id: e.prospecto_id,
    cliente_id: e.cliente_id,
    creado_en: e.creado_en,
  };
}

function mapEnlaceToDB(e: Partial<EnlaceDocumento>): any {
  return {
    titulo: e.titulo,
    url: e.url,
    tipo_documento: e.tipo_documento,
    prospecto_id: e.prospecto_id,
    cliente_id: e.cliente_id,
  };
}
