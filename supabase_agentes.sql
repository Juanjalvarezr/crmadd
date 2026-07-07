create table if not exists public.agentes (
  id text primary key,
  nombre text not null,
  descripcion text,
  tipo text not null check (tipo in ('ventas','seguimiento','facturacion','soporte','custom')),
  estado text not null default 'borrador' check (estado in ('activo','pausado','borrador')),
  prompts jsonb not null default '[]',
  herramientas jsonb not null default '[]',
  trigger text not null default 'manual' check (trigger in ('manual','evento','cron','webhook')),
  activo boolean not null default false,
  rutas_activas jsonb not null default '[]',
  ultima_ejecucion text,
  metricas jsonb not null default '{"ejecuciones":0,"exito":0,"fallos":0}',
  created_at text not null default now(),
  updated_at text not null default now()
);

alter table public.agentes enable row level security;

drop policy if exists "Allow read access" on public.agentes;
create policy "Allow read access" on public.agentes for select using (true);

drop policy if exists "Allow write access" on public.agentes;
create policy "Allow write access" on public.agentes for all using (true) with check (true);
