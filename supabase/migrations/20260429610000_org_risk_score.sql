-- Organization Risk Scoring Columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'LOW';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_updated_at TIMESTAMPTZ;
