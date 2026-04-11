CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise', 'mssp')),
  max_agents INTEGER DEFAULT 5,
  max_alerts_per_day INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  connector_type TEXT NOT NULL CHECK (connector_type IN ('wazuh', 'splunk', 'crowdstrike', 'sentinelone', 'microsoft_defender', 'elastic', 'custom')),
  connector_name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_ping TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE soc_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_alerts INTEGER DEFAULT 0,
  alerts_closed INTEGER DEFAULT 0,
  alerts_escalated INTEGER DEFAULT 0,
  mean_time_to_detect_ms BIGINT DEFAULT 0,
  mean_time_to_respond_ms BIGINT DEFAULT 0,
  false_positive_rate FLOAT DEFAULT 0,
  l1_processed INTEGER DEFAULT 0,
  l2_processed INTEGER DEFAULT 0,
  l3_hunts INTEGER DEFAULT 0,
  sigma_rules_generated INTEGER DEFAULT 0,
  ips_blocked INTEGER DEFAULT 0,
  identities_isolated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, metric_date)
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON organization_members FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON connectors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON soc_metrics FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_connectors_org_id ON connectors(organization_id);
CREATE INDEX idx_soc_metrics_org_date ON soc_metrics(organization_id, metric_date DESC);
