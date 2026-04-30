-- Sprint 4: Threat Intelligence Feed Ingestion Pipeline

-- Global threat indicators table (no org_id)
CREATE TABLE IF NOT EXISTS threat_iocs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ioc_type TEXT NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'url', 'hash_md5', 'hash_sha256', 'email', 'cve')),
    ioc_value TEXT NOT NULL,
    threat_score INTEGER DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
    confidence DECIMAL(3, 2) DEFAULT 0.50,
    tags TEXT[] DEFAULT '{}',
    malware_families TEXT[] DEFAULT '{}',
    sources TEXT[] DEFAULT '{}',
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(ioc_type, ioc_value)
);

-- Multi-tenant sightings table
CREATE TABLE IF NOT EXISTS ioc_hits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ioc_id UUID REFERENCES threat_iocs(id) ON DELETE CASCADE,
    alert_id UUID, -- Optional: link to internal alert if available
    hit_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global feed configuration
CREATE TABLE IF NOT EXISTS cti_feeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    feed_type TEXT NOT NULL, -- 'abuse.ch', 'cisa', 'nvd', etc.
    endpoint_url TEXT NOT NULL,
    auth_config JSONB DEFAULT '{}',
    pull_interval INTERVAL DEFAULT '1 day',
    last_pulled_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE threat_iocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ioc_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE cti_feeds ENABLE ROW LEVEL SECURITY;

-- Policies for threat_iocs (Global Read)
CREATE POLICY "Allow public read of threat_iocs" ON threat_iocs FOR SELECT USING (true);

-- Policies for ioc_hits (Multi-tenant)
CREATE POLICY "Allow org members to select ioc_hits" ON ioc_hits FOR SELECT USING (
    org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Allow org members to insert ioc_hits" ON ioc_hits FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text)
);

-- Policies for cti_feeds (Global Read)
CREATE POLICY "Allow public read of cti_feeds" ON cti_feeds FOR SELECT USING (true);

-- RPC for confidence decay
CREATE OR REPLACE FUNCTION decay_ioc_confidence()
RETURNS void AS $$
BEGIN
    UPDATE threat_iocs
    SET confidence = ROUND(confidence * 0.95, 2),
        is_active = CASE WHEN (confidence * 0.95) < 0.20 THEN FALSE ELSE TRUE END
    WHERE is_active = TRUE
      AND NOT (tags @> ARRAY['kev']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
