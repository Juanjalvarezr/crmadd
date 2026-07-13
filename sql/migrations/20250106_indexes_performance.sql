BEGIN;

CREATE INDEX IF NOT EXISTS idx_configuracion_empresa_id ON public.configuracion_empresa(id);
CREATE INDEX IF NOT EXISTS idx_prompts_ai_slug ON public.prompts_ai(slug);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON public.notificaciones(created_at);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.notificaciones(leida);

-- safe conditional index only when table+column exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conocimiento_agencia' AND column_name='tipo'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conocimiento_tipo ON public.conocimiento_agencia(tipo);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reglas_ai' AND column_name='activo'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reglas_ai_activo ON public.reglas_ai(activo);
  END IF;
END
$$;

COMMIT;
