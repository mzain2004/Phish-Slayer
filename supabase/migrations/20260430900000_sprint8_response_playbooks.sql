-- Sprint 8: Response Playbook Builder + Execution Engine

-- Playbook Definitions
CREATE TABLE IF NOT EXISTS playbooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for platform defaults
    name TEXT NOT NULL,
    description TEXT,
    trigger_conditions JSONB DEFAULT '{"severity_min": "high", "mitre_techniques": [], "event_types": []}',
    steps JSONB NOT NULL DEFAULT '[]', -- Ordered array of step objects
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'DISABLED')),
    human_approval_required BOOLEAN DEFAULT FALSE,
    approval_timeout_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook Execution Tracking
CREATE TABLE IF NOT EXISTS playbook_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
    current_step_index INTEGER DEFAULT 0,
    results JSONB DEFAULT '[]', -- Array of step results
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT
);

-- Containment Verification Tracking
CREATE TABLE IF NOT EXISTS containment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action_id UUID REFERENCES containment_actions(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PASSED', 'FAILED', 'UNKNOWN')),
    details JSONB DEFAULT '{}',
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE containment_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow members to select playbooks" ON playbooks
    FOR SELECT USING (org_id IS NULL OR org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert playbooks" ON playbooks
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to update playbooks" ON playbooks
    FOR UPDATE USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select playbook_runs" ON playbook_runs
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert playbook_runs" ON playbook_runs
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to update playbook_runs" ON playbook_runs
    FOR UPDATE USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select verifications" ON containment_verifications
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE INDEX IF NOT EXISTS idx_playbooks_org_id ON playbooks(org_id);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_case_id ON playbook_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_alert_id ON playbook_runs(alert_id);
