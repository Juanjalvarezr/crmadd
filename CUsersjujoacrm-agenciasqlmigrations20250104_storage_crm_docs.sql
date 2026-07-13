BEGIN;

-- Bucket crm-docs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('crm-docs', 'crm-docs', false, 52428800, ARRAY['application/pdf','image/*','text/*','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) ON CONFLICT (id) DO NOTHING;

-- Política de lectura
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Allow read access') THEN CREATE POLICY "Allow read access" ON storage.objects FOR SELECT USING ( bucket_id = 'crm-docs' ); END IF; END $$;

-- Política de inserción
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Allow insert access') THEN CREATE POLICY "Allow insert access" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'crm-docs' ); END IF; END $$;

-- Política de actualización
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Allow update access') THEN CREATE POLICY "Allow update access" ON storage.objects FOR UPDATE USING ( bucket_id = 'crm-docs' ); END IF; END $$;

-- Política de eliminación
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Allow delete access') THEN CREATE POLICY "Allow delete access" ON storage.objects FOR DELETE USING ( bucket_id = 'crm-docs' ); END IF; END $$;

COMMIT;
