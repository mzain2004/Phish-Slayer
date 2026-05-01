-- Sprint 15: Integration Marketplace + Tenant Quotas + Feature Flags + API Keys

-- Part 1: Modify Organizations Table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan_limits JSONB DEFAULT '{
    "alerts_per_day": 100,
    "agents_concurrent": 5,
    "retention_days": 30,
    "connectors_max": 3,
    "users_max": 3,
    "llm_tokens_per_day": 50000,
    "osint_scans_per_day": 10
}';

-- Part 2: Quota Usage Table
CREATE TABLE IF NOT EXISTS public.quota_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    UNIQUE(org_id, metric, period_start)
);
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON public.quota_usage
    FOR ALL USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

-- Part 3: Feature Flags Table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    plan_required TEXT,
    UNIQUE(org_id, flag_name)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON public.feature_flags
    FOR ALL USING (org_id IS NULL OR org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

-- Seed Default Feature Flags (Platform level, org_id IS NULL)
INSERT INTO public.feature_flags (flag_name, is_enabled, plan_required) VALUES
    ('osint_brand_monitor', true, 'pro'),
    ('osint_dark_web', true, 'enterprise'),
    ('malware_sandbox', true, 'pro'),
    ('threat_actor_profiles', true, 'pro'),
    ('compliance_module', true, 'pro'),
    ('playbook_builder', true, 'pro')
ON CONFLICT (org_id, flag_name) DO NOTHING;

-- Part 4: API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON public.api_keys
    FOR ALL USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));
