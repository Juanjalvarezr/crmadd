-- Storage bucket config for CRM documents
-- Ejecutar en Supabase SQL Editor en bloques chicos

-- 1/3 Bucket público para documentos CRM
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-docs',
  'crm-docs',
  true,
  52428800,
  ARRAY['application/pdf','image/png','image/jpeg','image/gif','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2/3 Política: lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'crm-docs' );

-- 3/3 Políticas: escritura autenticada
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crm-docs' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'crm-docs' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'crm-docs' AND
  auth.role() = 'authenticated'
);
