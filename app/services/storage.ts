import { supabase } from './supabase';

export async function uploadPDFToStorage(blob: Blob, path: string) {
  const fileName = `${path}-${Date.now()}.pdf`;
  const storagePath = `crm-docs/${fileName}`;

  const { error } = await supabase.storage
    .from('crm-docs')
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('crm-docs')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export function getPublicPDFUrl(path: string) {
  const { data } = supabase.storage
    .from('crm-docs')
    .getPublicUrl(path);
  return data.publicUrl;
}
