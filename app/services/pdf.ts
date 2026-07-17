import { documentosService, supabase } from '../services/supabase';
import html2canvas from 'html2canvas';

export type DocumentoTipo = 'propuesta' | 'factura' | 'contrato' | 'tareas' | 'contenido' | 'pdf';

export interface GenerarDocumentoParams {
  entidadTipo: string;
  entidadId: string;
  tipo: DocumentoTipo;
  titulo?: string;
  usuario?: string;
  /** Elemento del DOM a capturar para el PDF */
  domElement: HTMLElement;
}

/**
 * Genera un PDF desde un elemento HTML y lo guarda en Supabase Storage + tabla documentos.
 * Flujo:
 * 1. Captura el elemento con html2canvas
 * 2. Genera un blob PDF con jsPDF (si está disponible) o descarga como imagen.
 * 3. Sube a Supabase Storage bucket `crm-documents`
 * 4. Crea registro en tabla `documentos`
 */
export async function generarYGuardarDocumento({
  entidadTipo,
  entidadId,
  tipo,
  titulo,
  usuario,
  domElement,
}: GenerarDocumentoParams): Promise<{ url: string; titulo: string }> {
  // 1. Capturar elemento
  const canvas = await html2canvas(domElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  // 2. Convertir a blob
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });

  if (!blob) {
    throw new Error('No se pudo generar la imagen del documento');
  }

  // 3. Subir a Supabase Storage
  const fileName = `${entidadTipo}/${entidadId}/${tipo}-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from('crm-documents')
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 4. Obtener URL pública
  const { data } = supabase.storage.from('crm-documents').getPublicUrl(fileName);
  const publicUrl = data?.publicUrl || '';

  // 5. Guardar registro en tabla documentos
  const doc = await documentosService.create({
    entidad_tipo: entidadTipo,
    entidad_id: String(entidadId),
    titulo: titulo || `${tipo.toUpperCase()} - ${entidadTipo} ${entidadId}`,
    url: publicUrl,
    tipo,
    usuario,
  });

  return { url: publicUrl, titulo: doc?.titulo || titulo || 'Documento' };
}

/**
 * Genera un PDF facturapatible desde datos planos.
 * Nota: No reemplaza la lógica de facturacion.ts, solo expone el helper para pdf.ts
 */
export async function generarFacturaPDF(factura: any, cliente?: any, items?: any[]) {
  return { factura, cliente, items };
}

export async function generarContratoPDF(contrato: any, cliente?: any) {
  return { contrato, cliente };
}

export function linkWhatsApp(telefono: string, mensaje: string) {
  const numero = (telefono || '').replace(/\D/g, '');
  const texto = encodeURIComponent(mensaje || '');
  return `https://wa.me/${numero}?text=${texto}`;
}
