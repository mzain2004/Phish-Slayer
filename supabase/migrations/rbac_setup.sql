-- Add role column to profiles table
alter table public.profiles 
  add column if not exists role text default 'analyst' 
  check (role in ('super_admin', 'manager', 'analyst', 'viewer'));

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists department text,
  add column if not exists is_active boolean default true;

-- Add user_id and assigned_to columns to scans and incidents
alter table public.scans
  add column if not exists user_id uuid references auth.users(id);

alter table public.incidents  
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists assigned_to uuid references auth.users(id);

-- DROP existing RLS policies and recreate with role-based logic

-- SCANS table RLS
drop policy if exists "authenticated_access" on public.scans;

create policy "scans_super_admin_manager" on public.scans
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('super_admin', 'manager')
    )
  );

create policy "scans_analyst_own" on public.scans
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'analyst'
    ) and user_id = auth.uid()
  );

create policy "scans_viewer_read" on public.scans
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'viewer'
    )
  );

-- INCIDENTS table RLS
drop policy if exists "authenticated_access" on public.incidents;

create policy "incidents_super_admin_manager" on public.incidents
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('super_admin', 'manager')
    )
  );

create policy "incidents_analyst_assigned" on public.incidents
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'analyst'
    ) and (created_by = auth.uid() or assigned_to = auth.uid())
  );

create policy "incidents_viewer_read" on public.incidents
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'viewer'
    )
  );

-- PROFILES table RLS
drop policy if exists "authenticated_access" on public.profiles;

create policy "profiles_own" on public.profiles
  for all using (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'super_admin'
    )
  );

-- WHITELIST + PROPRIETARY_INTEL: manager and above only
drop policy if exists "authenticated_access" on public.whitelist;
create policy "whitelist_manager_above" on public.whitelist
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('super_admin', 'manager')
    )
  );

drop policy if exists "authenticated_access" on public.proprietary_intel;
create policy "intel_manager_above" on public.proprietary_intel
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('super_admin', 'manager')
    )
  );
