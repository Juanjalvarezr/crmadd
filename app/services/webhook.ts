import { supabase } from "../services/supabase";

export const webhookService = {
  async registrarEvento(payload: {
    direccion?: string;
    fuente?: string;
    tipo_evento?: string;
    datos?: any;
    estado?: string;
    proyecto_id?: string | null;
  }) {
    try {
      const { data, error } = await supabase
        .from("n8n_events")
        .insert([
          {
            direccion: payload.direccion || "entrada",
            fuente: payload.fuente || "crm",
            tipo_evento: payload.tipo_evento || "evento_general",
            payload: payload.datos || {},
            estado: payload.estado || "pendiente",
            proyecto_id: payload.proyecto_id || null,
            fecha_procesamiento: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { ok: true as const, data };
    } catch (error) {
      console.warn("webhookService.registrarEvento fallo:", error);
      return { ok: false as const, error };
    }
  },
};
