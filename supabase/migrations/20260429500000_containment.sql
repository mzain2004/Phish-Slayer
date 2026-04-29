-- Containment Actions Table
CREATE TABLE IF NOT EXISTS containment_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action_type TEXT CHECK (action_type IN ('block_ip','disable_account','isolate_endpoint','unblock_ip','enable_account')),
  target_value TEXT NOT NULL,
  reason TEXT,
  alert_id UUID,
  incident_id UUID,
  executed_by TEXT NOT NULL,
  connector_used TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed','partial')),
  response_data JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  reversed_at TIMESTAMPTZ,
  reversed_by TEXT
);

ALTER TABLE containment_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select containment actions"
  ON containment_actions FOR SELECT
  USING (true);

CREATE POLICY "Allow members to insert containment actions"
  ON containment_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow members to update containment actions"
  ON containment_actions FOR UPDATE
  USING (true);
