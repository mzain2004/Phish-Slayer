-- Notifications, Assets, and SLA Schema

-- Notification Configs
CREATE TABLE IF NOT EXISTS notification_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    channel_type TEXT NOT NULL,
    channel_name TEXT,
    config JSONB NOT NULL,
    severity_threshold TEXT DEFAULT 'medium',
    event_types TEXT[] DEFAULT ARRAY['critical_alert','incident_created'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Log
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    channel_type TEXT,
    event_type TEXT,
    status TEXT CHECK (status IN ('sent', 'failed')),
    error TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Asset Inventory
CREATE TABLE IF NOT EXISTS asset_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    asset_type TEXT CHECK (asset_type IN ('endpoint', 'server', 'network_device', 'cloud_resource', 'saas_app', 'identity')),
    hostname TEXT,
    ip_addresses TEXT[] DEFAULT '{}',
    mac_address TEXT,
    os TEXT,
    os_version TEXT,
    owner_user_id TEXT,
    department TEXT,
    criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
    tags TEXT[] DEFAULT '{}',
    connected_connector_ids UUID[] DEFAULT '{}',
    last_seen TIMESTAMPTZ,
    first_seen TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- SLA Columns for Cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_resolved_within_sla BOOLEAN;

-- Enable RLS
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Org Scoped)
CREATE POLICY "Org access for notification_configs" ON notification_configs FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id'));
CREATE POLICY "Org access for notification_log" ON notification_log FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id'));
CREATE POLICY "Org insert for notification_log" ON notification_log FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));
CREATE POLICY "Org access for asset_inventory" ON asset_inventory FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id'));

-- Indices
CREATE INDEX IF NOT EXISTS idx_notif_config_org ON notification_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org ON asset_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_hostname ON asset_inventory(hostname);
CREATE INDEX IF NOT EXISTS idx_assets_ip ON asset_inventory USING GIN (ip_addresses);
