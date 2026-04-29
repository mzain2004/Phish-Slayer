-- Add deduplication columns to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedup_group_id TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedup_count INTEGER DEFAULT 1;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_suppressed BOOLEAN DEFAULT false;

-- Add indices for faster deduplication lookups
CREATE INDEX IF NOT EXISTS idx_alerts_dedup_lookup ON alerts (org_id, title, source_ip) WHERE (status = 'open');
