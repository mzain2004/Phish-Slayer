-- OSINT Module Schema
CREATE TABLE IF NOT EXISTS osint_investigations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('domain','ip','email','hash','person','company')),
  target_value TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
  risk_score INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS osint_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investigation_id UUID REFERENCES osint_investigations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  collector TEXT NOT NULL,
  raw_data JSONB,
  iocs_extracted JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS osint_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investigation_id UUID REFERENCES osint_investigations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  narrative TEXT,
  risk_score INTEGER DEFAULT 0,
  key_findings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE osint_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE osint_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE osint_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select osint_investigations" ON osint_investigations FOR SELECT USING (true);
CREATE POLICY "Allow members to insert osint_investigations" ON osint_investigations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update osint_investigations" ON osint_investigations FOR UPDATE USING (true);

CREATE POLICY "Allow members to select osint_results" ON osint_results FOR SELECT USING (true);
CREATE POLICY "Allow members to insert osint_results" ON osint_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow members to select osint_reports" ON osint_reports FOR SELECT USING (true);
CREATE POLICY "Allow members to insert osint_reports" ON osint_reports FOR INSERT WITH CHECK (true);
