import { supabase } from './app/services/supabase';

export interface FeedbackReport {
  tipo: 'ERROR' | 'MEJORA' | 'ACCION_FALTANTE';
  descripcion: string;
  ruta: string;
  usuario: string;
}

export const feedbackService = {
  async enviarReporte(reporte: FeedbackReport): Promise<any> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        accion: `REPORT_ ${reporte.tipo}`,
        modulo: reporte.ruta,
        detalle: reporte.descripcion,
        usuario: reporte.usuario,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Error enviando feedback:", error);
      throw error;
    }
    return { success: true, data };
  }
};