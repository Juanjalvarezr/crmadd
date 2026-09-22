import { supabase } from './supabase';
import { PDFGenerator } from './pdfGenerator';

export async function generarYGuardarPDF(tipo: 'factura' | 'cotizacion' | 'contrato' | 'propuesta', datos: any) {
  try {
    // Generar PDF
    const pdfBytes = await PDFGenerator[tipo](datos);
    
    // Crear archivo PDF
    const fileName = `crm-documents/${tipo}-${datos.id || Date.now()}.pdf`;
    const file = new File([pdfBytes], fileName, { type: 'application/pdf' });
    
    // Subir al bucket
    const { error: uploadError } = await supabase.storage
      .from('crm-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
    
    if (uploadError) throw uploadError;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage.from('crm-documents').getPublicUrl(fileName);
    const url = urlData?.publicUrl || fileName;
    
    // Registrar en tabla documentos
    await supabase.from('documentos').insert([{
      titulo: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} #${datos.id || Date.now()}`,
      tipo,
      url,
      proyecto_id: datos.proyecto_id ?? null,
      cliente_id: datos.cliente_id ?? null,
      factura_id: tipo === 'factura' ? String(datos.id ?? null) : null,
      descripcion: 'Generado automáticamente con pdf-lib',
    }]);
    
    return { ok: true as const, url };
  } catch (e: any) {
    console.error('[docs] error generando PDF:', e);
    return { ok: false as const, error: e?.message || 'Error generando PDF' };
  }
}

// Alias para compatibilidad con clientes.tsx
export { generarYGuardarPDF as generarYGuardarDocumento };
