import { supabase } from './supabase';

const BUCKET = 'crm-docs';

export async function uploadPDFToStorage(blob: Blob, path: string) {
  const fileName = `${path}-${Date.now()}.pdf`;
  const storagePath = `${BUCKET}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function uploadFileToStorage(file: File, folder: string) {
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const storagePath = `${BUCKET}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return {
    path: storagePath,
    url: data.publicUrl,
    size: file.size,
    type: file.type,
    name: file.name,
  };
}

export async function deleteStorageFile(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path.replace(`${BUCKET}/`, '')]);

  if (error) throw error;
  return true;
}

export function getPublicPDFUrl(path: string) {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

export function getSignedUrl(path: string, expiresIn = 3600) {
  return supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
}
