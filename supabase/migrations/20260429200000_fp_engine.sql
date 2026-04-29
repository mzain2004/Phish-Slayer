-- FP Fingerprints Table
CREATE TABLE IF NOT EXISTS fp_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id TEXT,
  source_ip TEXT,
  source_ip_range TEXT,
  destination_port INTEGER,
  alert_type TEXT,
  marked_by TEXT,
  hit_count INTEGER DEFAULT 1,
  last_hit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE fp_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select fp fingerprints"
  ON fp_fingerprints FOR SELECT
  USING (true);

CREATE POLICY "Allow members to insert fp fingerprints"
  ON fp_fingerprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow members to update fp fingerprints"
  ON fp_fingerprints FOR UPDATE
  USING (true);

-- Alert Table Updates
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN DEFAULT false;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS fp_marked_by TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS fp_marked_at TIMESTAMPTZ;
