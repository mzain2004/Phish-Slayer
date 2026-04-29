-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('ip','domain','email','user','hash')),
  entity_value TEXT NOT NULL,
  reason TEXT,
  added_by TEXT,
  expires_at TIMESTAMPTZ,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, entity_type, entity_value)
);

-- RLS Policies
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to select watchlist"
  ON watchlist FOR SELECT
  USING (true);

CREATE POLICY "Allow members to insert watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow members to delete watchlist"
  ON watchlist FOR DELETE
  USING (true);
