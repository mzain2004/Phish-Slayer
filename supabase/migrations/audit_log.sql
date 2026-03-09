create table if not exists public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  user_email text,
  user_role text,
  action text not null,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log_admin_only" on public.audit_log
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('super_admin', 'manager')
    )
  );

create policy "audit_log_insert_authenticated" on public.audit_log
  for insert with check (auth.role() = 'authenticated');

create index if not exists idx_audit_log_created_at 
  on public.audit_log(created_at desc);
create index if not exists idx_audit_log_user_id 
  on public.audit_log(user_id);
create index if not exists idx_audit_log_action 
  on public.audit_log(action);