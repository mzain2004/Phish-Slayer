-- PIR and Knowledge Base Tables
CREATE TABLE IF NOT EXISTS post_incident_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID,
  title TEXT NOT NULL,
  timeline TEXT,
  root_cause TEXT,
  impact TEXT,
  response_actions TEXT,
  lessons_learned TEXT,
  action_items JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('runbook','playbook','ttp_reference','past_incident','procedure')),
  content TEXT,
  tags TEXT[],
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_incident_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select PIRs" ON post_incident_reviews FOR SELECT USING (true);
CREATE POLICY "Allow members to insert PIRs" ON post_incident_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update PIRs" ON post_incident_reviews FOR UPDATE USING (true);

CREATE POLICY "Allow members to select knowledge" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY "Allow members to insert knowledge" ON knowledge_base FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update knowledge" ON knowledge_base FOR UPDATE USING (true);
CREATE POLICY "Allow members to delete knowledge" ON knowledge_base FOR DELETE USING (true);
