-- ================================================================
-- PhishSlayer: Multi-Tenant MSSP Portal Schema
-- ================================================================

-- ── tenants table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  status TEXT DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial')),
  owner_user_id TEXT NOT NULL,
  sla_config JSONB DEFAULT '{"p1_response_minutes":15,"p2_response_minutes":60,"p3_response_minutes":240,"p4_response_minutes":1440}'::jsonb,
  branding JSONB DEFAULT '{}'::jsonb,
  alert_quota_monthly INTEGER DEFAULT 10000,
  alerts_used_this_month INTEGER DEFAULT 0,
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── tenant_users table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('owner', 'analyst', 'manager', 'readonly')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, user_id)
);

-- ── whitelabel_api_keys table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whitelabel_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Helper for alert counts ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_tenant_alerts(t_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.tenants
    SET alerts_used_this_month = alerts_used_this_month + 1
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Enable RLS ───────────────────────────────────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelabel_api_keys ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'tenants_policy') THEN
    CREATE POLICY "tenants_policy" ON public.tenants USING (auth.jwt() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_users' AND policyname = 'tenant_users_policy') THEN
    CREATE POLICY "tenant_users_policy" ON public.tenant_users USING (auth.jwt() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whitelabel_api_keys' AND policyname = 'api_keys_policy') THEN
    CREATE POLICY "api_keys_policy" ON public.whitelabel_api_keys USING (auth.jwt() IS NOT NULL);
  END IF;
END $$;

-- ── Indices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
