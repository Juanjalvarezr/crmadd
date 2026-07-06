import { supabase } from "./database";

export type Agente = {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: "ventas" | "seguimiento" | "facturacion" | "soporte" | "custom";
  estado: "activo" | "pausado" | "borrador";
  prompts: string[];
  herramientas: string[];
  trigger: "manual" | "evento" | "cron" | "webhook";
  activo: boolean;
  ultima_ejecucion?: string | null;
  metricas?: { ejecuciones: number; exito: number; fallos: number };
  created_at: string;
  updated_at: string;
};

export const agentesService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("agentes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as Agente[]) || [];
    } catch {
      return [];
    }
  },
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("agentes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Agente;
    } catch {
      throw new Error("No se pudo cargar el agente");
    }
  },
  async create(payload: Omit<Agente, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("agentes")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Agente;
    } catch {
      throw new Error("No se pudo crear el agente");
    }
  },
  async update(id: string, payload: Partial<Omit<Agente, "id" | "created_at" | "updated_at">>) {
    try {
      const { data, error } = await supabase
        .from("agentes")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Agente;
    } catch {
      throw new Error("No se pudo actualizar el agente");
    }
  },
  async remove(id: string) {
    try {
      const { error } = await supabase
        .from("agentes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return id;
    } catch {
      throw new Error("No se pudo eliminar el agente");
    }
  }
};
