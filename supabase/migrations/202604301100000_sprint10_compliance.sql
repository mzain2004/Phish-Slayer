-- Sprint 10: Cryptographic Audit Trail + Compliance Mapping + GDPR Agent

-- 1. Immutable Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('L1_AGENT', 'L2_AGENT', 'L3_AGENT', 'SYSTEM', 'USER')),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    previous_hash TEXT,
    current_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deny Updates and Deletes to ensure immutability
CREATE OR REPLACE FUNCTION deny_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Updates and Deletes are not allowed on the audit_trail table.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_trail_deny_update
BEFORE UPDATE ON public.audit_trail
FOR EACH ROW EXECUTE FUNCTION deny_modification();

CREATE TRIGGER audit_trail_deny_delete
BEFORE DELETE ON public.audit_trail
FOR EACH ROW EXECUTE FUNCTION deny_modification();

-- 2. Regulatory Deadlines
CREATE TABLE IF NOT EXISTS public.regulatory_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    regulation TEXT NOT NULL CHECK (regulation IN ('GDPR', 'HIPAA', 'PCI', 'CCPA')),
    deadline_type TEXT NOT NULL CHECK (deadline_type IN ('notification_72h', 'breach_report')),
    trigger_at TIMESTAMPTZ DEFAULT NOW(),
    deadline_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'met', 'breached')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow members to select audit_trail" ON public.audit_trail
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert audit_trail" ON public.audit_trail
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select deadlines" ON public.regulatory_deadlines
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert deadlines" ON public.regulatory_deadlines
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to update deadlines" ON public.regulatory_deadlines
    FOR UPDATE USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE INDEX IF NOT EXISTS idx_audit_trail_org_created ON public.audit_trail(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deadlines_org_status ON public.regulatory_deadlines(org_id, status);
