import { supabase } from "../supabase";

export type CalendarProvider = "google" | "outlook" | "caldav";

export interface CalendarSyncConfig {
  id?: string;
  user_id?: string;
  provider: CalendarProvider;
  enabled: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  calendar_id?: string;
  sync_direction: "import" | "export" | "both";
  sync_interval_minutes: number;
  last_sync_at?: string;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarSyncLog {
  id?: string;
  config_id?: string;
  started_at: string;
  finished_at?: string;
  status: "running" | "success" | "error" | "partial";
  events_processed: number;
  error_message?: string;
}

export const calendarSyncService = {
  async getConfigs(): Promise<CalendarSyncConfig[]> {
    const { data, error } = await supabase
      .from("calendar_sync_configs")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Error cargando configuraciones: ${error.message}`);
    return (data || []) as CalendarSyncConfig[];
  },

  async upsertConfig(config: CalendarSyncConfig): Promise<CalendarSyncConfig> {
    const { data, error } = await supabase
      .from("calendar_sync_configs")
      .upsert(config as any, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new Error(`Error guardando configuración: ${error.message}`);
    return data as CalendarSyncConfig;
  },

  async deleteConfig(id: string): Promise<void> {
    const { error } = await supabase.from("calendar_sync_configs").delete().eq("id", id);
    if (error) throw new Error(`Error eliminando configuración: ${error.message}`);
  },

  async logSync(log: CalendarSyncLog): Promise<void> {
    const { error } = await supabase.from("calendar_sync_logs").insert(log as any);
    if (error) console.warn("No se pudo guardar log de sincronización", error);
  },

  async getRecentLogs(configId?: string): Promise<CalendarSyncLog[]> {
    let query = supabase
      .from("calendar_sync_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (configId) query = query.eq("config_id", configId);
    const { data, error } = await query;
    if (error) throw new Error(`Error cargando logs: ${error.message}`);
    return (data || []) as CalendarSyncLog[];
  },
};
