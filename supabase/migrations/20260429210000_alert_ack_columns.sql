-- Add Acknowledgment and Assignment columns to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- Index for assigned alerts
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON alerts (assigned_to) WHERE (assigned_to IS NOT NULL);
