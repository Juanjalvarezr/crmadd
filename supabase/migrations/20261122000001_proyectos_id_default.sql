-- proyectos.id es text NOT NULL sin default: la app no lo genera al crear.
-- Default uuid para que proyectosService.create y el cierre de oportunidad funcionen.
ALTER TABLE public.proyectos ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
