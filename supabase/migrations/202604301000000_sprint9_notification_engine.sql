-- Sprint 9: Multi-Channel Notification Engine + On-Call Rotation

-- 1. Notification Channels
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('email', 'slack', 'teams', 'pagerduty', 'webhook')),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Notification Rules
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE CASCADE,
    trigger_conditions JSONB DEFAULT '{"severities": [], "event_types": []}',
    cooldown_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Notification Log (Enhanced)
-- Drop existing if it conflicts too much, or just create with new name if needed.
-- We'll use sprint9_notification_log to avoid collision with legacy table if it exists.
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES notification_rules(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE SET NULL,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('sent', 'failed', 'skipped')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- 4. On-Call Rotations
CREATE TABLE IF NOT EXISTS on_call_rotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    members JSONB DEFAULT '[]', -- Array of {user_id, email, slack_id}
    current_index INTEGER DEFAULT 0,
    handoff_time TIMESTAMPTZ DEFAULT now() + interval '24 hours',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_call_rotations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow members to select notification_channels" ON notification_channels 
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert notification_channels" ON notification_channels 
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select notification_rules" ON notification_rules 
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert notification_rules" ON notification_rules 
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select notification_logs" ON notification_logs 
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to select rotations" ON on_call_rotations 
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE INDEX IF NOT EXISTS idx_notif_logs_org_id ON notification_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_notif_rules_org_id ON notification_rules(org_id);
