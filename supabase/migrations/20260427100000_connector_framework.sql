-- Connector Framework Schema

-- Connector Configs Table
CREATE TABLE IF NOT EXISTS connector_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    vendor TEXT NOT NULL,
    connector_type TEXT NOT NULL CHECK (connector_type IN ('edr', 'siem', 'firewall', 'wazuh')),
    display_name TEXT,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connector Events Table
CREATE TABLE IF NOT EXISTS connector_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    connector_id UUID REFERENCES connector_configs(id) ON DELETE CASCADE,
    event_type TEXT,
    severity TEXT,
    raw_payload JSONB,
    normalized_fields JSONB,
    ingested_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT false
);

-- Connector Actions Table
CREATE TABLE IF NOT EXISTS connector_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    connector_id UUID REFERENCES connector_configs(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    result JSONB,
    initiated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE connector_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_actions ENABLE ROW LEVEL SECURITY;

-- Policies for connector_configs
CREATE POLICY "Users can view their organization's connector configs"
ON connector_configs FOR SELECT
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert connector configs for their organization"
ON connector_configs FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can update their organization's connector configs"
ON connector_configs FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can delete their organization's connector configs"
ON connector_configs FOR DELETE
USING (organization_id = (auth.jwt() ->> 'org_id'));

-- Policies for connector_events
CREATE POLICY "Users can view their organization's connector events"
ON connector_events FOR SELECT
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert connector events for their organization"
ON connector_events FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can update their organization's connector events"
ON connector_events FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can delete their organization's connector events"
ON connector_events FOR DELETE
USING (organization_id = (auth.jwt() ->> 'org_id'));

-- Policies for connector_actions
CREATE POLICY "Users can view their organization's connector actions"
ON connector_actions FOR SELECT
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert connector actions for their organization"
ON connector_actions FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can update their organization's connector actions"
ON connector_actions FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can delete their organization's connector actions"
ON connector_actions FOR DELETE
USING (organization_id = (auth.jwt() ->> 'org_id'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_connector_configs_org ON connector_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_connector_events_org ON connector_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_connector_actions_org ON connector_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_connector_events_connector_id ON connector_events(connector_id);
