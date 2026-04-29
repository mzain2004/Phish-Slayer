-- Suppression Rules Table
CREATE TABLE IF NOT EXISTS suppression_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('ip','domain','time_window','severity','rule_name')),
  match_value TEXT,
  time_start TIME,
  time_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE suppression_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select suppression rules"
  ON suppression_rules FOR SELECT
  USING (true);

CREATE POLICY "Allow members to insert suppression rules"
  ON suppression_rules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow members to update suppression rules"
  ON suppression_rules FOR UPDATE
  USING (true);

CREATE POLICY "Allow members to delete suppression rules"
  ON suppression_rules FOR DELETE
  USING (true);

-- Function to increment hit count
CREATE OR REPLACE FUNCTION increment_suppression_hit(rule_id UUID)
RETURNS VOID AS 
BEGIN
  UPDATE suppression_rules
  SET hit_count = hit_count + 1,
      last_hit_at = NOW()
  WHERE id = rule_id;
END;
 LANGUAGE plpgsql SECURITY DEFINER;
