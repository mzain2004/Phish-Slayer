create table if not exists public.endpoint_events (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  process_name text not null,
  pid text,
  remote_address text not null,
  remote_port integer,
  country text,
  country_code text,
  city text,
  isp text,
  threat_level text default 'low',
  threat_score integer default 0,
  source text default 'agent_telemetry',
  timestamp timestamptz default now(),
  raw_event jsonb,
  created_at timestamptz default now()
);

alter table public.endpoint_events enable row level security;

create policy "authenticated_access" on public.endpoint_events
  for all using (auth.role() = 'authenticated');

create index if not exists idx_endpoint_events_threat_level 
  on public.endpoint_events(threat_level);
create index if not exists idx_endpoint_events_created_at 
  on public.endpoint_events(created_at desc);
create index if not exists idx_endpoint_events_remote_address 
  on public.endpoint_events(remote_address);
