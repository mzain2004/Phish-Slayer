create table if not exists public.hunt_findings (
  id uuid primary key default gen_random_uuid(),
  hunt_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  title text not null,
  description text,
  indicators jsonb not null default '{}'::jsonb,
  source_records jsonb not null default '[]'::jsonb,
  escalated boolean not null default false,
  escalation_id uuid null references public.escalations(id) on delete set null,
  created_by text not null default 'l3_agent',
  created_at timestamptz not null default now()
);

create index if not exists idx_hunt_findings_created_at
  on public.hunt_findings (created_at desc);

create index if not exists idx_hunt_findings_escalated
  on public.hunt_findings (escalated, created_at desc);

alter table public.hunt_findings enable row level security;

drop policy if exists "hunt_findings_select_soc" on public.hunt_findings;
create policy "hunt_findings_select_soc"
  on public.hunt_findings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager', 'super_admin')
    )
  );
