-- Fix RLS Policies for Multi-Tenancy and IDOR protection
-- Created: 2026-04-26

-- ── incidents ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can view incidents" ON incidents;
DROP POLICY IF EXISTS "Authenticated users can manage incidents" ON incidents;

CREATE POLICY "incidents_select_policy" ON incidents
  FOR SELECT
  USING (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

CREATE POLICY "incidents_all_policy" ON incidents
  FOR ALL
  USING (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

-- ── tenants ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenants_policy" ON public.tenants;

CREATE POLICY "tenants_select_policy" ON public.tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

-- ── tenant_users ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_users_policy" ON public.tenant_users;

CREATE POLICY "tenant_users_policy" ON public.tenant_users
  FOR ALL
  USING ((auth.jwt()->>'sub') = user_id)
  WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- ── whitelabel_api_keys ──────────────────────────────────────────
DROP POLICY IF EXISTS "api_keys_policy" ON public.whitelabel_api_keys;

CREATE POLICY "api_keys_policy" ON public.whitelabel_api_keys
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

-- ── cases ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;

CREATE POLICY "cases_select_policy" ON public.cases
  FOR SELECT
  USING (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

CREATE POLICY "cases_insert_policy" ON public.cases
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

CREATE POLICY "cases_update_policy" ON public.cases
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );

CREATE POLICY "cases_delete_policy" ON public.cases
  FOR DELETE
  USING (
    organization_id IN (
      SELECT tenant_id::text FROM tenant_users
      WHERE user_id = (auth.jwt()->>'sub')
    )
  );
