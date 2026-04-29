-- Shift Handover Table
CREATE TABLE IF NOT EXISTS shift_handovers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  open_alerts_count INTEGER DEFAULT 0,
  critical_cases JSONB DEFAULT '[]',
  groq_narrative TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select shift handovers"
  ON shift_handovers FOR SELECT
  USING (true);

CREATE POLICY "Allow members to insert shift handovers"
  ON shift_handovers FOR INSERT
  WITH CHECK (true);
