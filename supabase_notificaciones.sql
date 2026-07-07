CREATE TABLE IF NOT EXISTS public.notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','success','warning','error')),
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  referencia_tipo TEXT,
  referencia_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.notificaciones(leida, created_at DESC);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access" ON public.notificaciones;
DROP POLICY IF EXISTS "Allow insert access" ON public.notificaciones;
DROP POLICY IF EXISTS "Allow update access" ON public.notificaciones;
DROP POLICY IF EXISTS "Allow delete access" ON public.notificaciones;

CREATE POLICY "Allow read access" ON public.notificaciones FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.notificaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.notificaciones FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON public.notificaciones FOR DELETE USING (true);
