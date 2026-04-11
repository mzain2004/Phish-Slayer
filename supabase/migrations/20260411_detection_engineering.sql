CREATE TABLE sigma_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES static_analysis(id) ON DELETE SET NULL,
  rule_name TEXT NOT NULL,
  rule_title TEXT NOT NULL,
  rule_description TEXT,
  rule_status TEXT DEFAULT 'experimental' CHECK (rule_status IN ('stable', 'test', 'experimental', 'deprecated')),
  rule_level TEXT DEFAULT 'medium' CHECK (rule_level IN ('informational', 'low', 'medium', 'high', 'critical')),
  rule_yaml TEXT NOT NULL,
  mitre_techniques JSONB DEFAULT '[]',
  false_positive_rate TEXT,
  auto_deployed BOOLEAN DEFAULT false,
  deployment_target TEXT DEFAULT 'wazuh',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ctem_exposures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('server', 'endpoint', 'network', 'identity', 'application')),
  exposure_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  cvss_score FLOAT,
  description TEXT,
  remediation TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted')),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sigma_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctem_exposures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON sigma_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON ctem_exposures FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_sigma_rules_alert_id ON sigma_rules(alert_id);
CREATE INDEX idx_sigma_rules_level ON sigma_rules(rule_level);
CREATE INDEX idx_ctem_exposures_severity ON ctem_exposures(severity);
CREATE INDEX idx_ctem_exposures_status ON ctem_exposures(status);
CREATE UNIQUE INDEX idx_ctem_exposures_asset_exposure_unique ON ctem_exposures(asset_name, exposure_type);
