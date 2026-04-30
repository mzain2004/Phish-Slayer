-- Sprint 3: OSINT Brand Monitoring & GitHub Leak Scanner

CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS osint_findings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'brand_impersonation', 'credential_leak', 'whois_change', etc.
  severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  source TEXT NOT NULL, -- 'CT_LOG', 'DOMAIN_REG', 'GITHUB', 'WHOIS'
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE osint_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select brand_assets" ON brand_assets FOR SELECT USING (true);
CREATE POLICY "Allow members to insert brand_assets" ON brand_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update brand_assets" ON brand_assets FOR UPDATE USING (true);
CREATE POLICY "Allow members to delete brand_assets" ON brand_assets FOR DELETE USING (true);

CREATE POLICY "Allow members to select osint_findings" ON osint_findings FOR SELECT USING (true);
CREATE POLICY "Allow members to insert osint_findings" ON osint_findings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update osint_findings" ON osint_findings FOR UPDATE USING (true);
