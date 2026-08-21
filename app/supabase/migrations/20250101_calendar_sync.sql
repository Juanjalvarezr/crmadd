-- calendar_sync_configs
create table if not exists public.calendar_sync_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null check (provider in ('google','outlook','caldav')),
  enabled boolean not null default true,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  calendar_id text,
  sync_direction text not null default 'both' check (sync_direction in ('import','export','both')),
  sync_interval_minutes integer not null default 60,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.calendar_sync_logs (
  id uuid primary key default gen_random_uuid(),
  config_id uuid references public.calendar_sync_configs(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running','success','error','partial')),
  events_processed integer not null default 0,
  error_message text
);
create index if not exists idx_calendar_sync_configs_user_id on public.calendar_sync_configs(user_id);
create index if not exists idx_calendar_sync_logs_config_id on public.calendar_sync_logs(config_id);
alter table public.calendar_sync_configs enable row level security;
alter table public.calendar_sync_logs enable row level security;
create policy "public_read_calendar_sync_configs" on public.calendar_sync_configs for select using (true);
create policy "public_write_calendar_sync_configs" on public.calendar_sync_configs for insert with check (true);
create policy "public_update_calendar_sync_configs" on public.calendar_sync_configs for update using (true);
create policy "public_delete_calendar_sync_configs" on public.calendar_sync_configs for delete using (true);
create policy "public_read_calendar_sync_logs" on public.calendar_sync_logs for select using (true);
create policy "public_write_calendar_sync_logs" on public.calendar_sync_logs for insert with check (true);
