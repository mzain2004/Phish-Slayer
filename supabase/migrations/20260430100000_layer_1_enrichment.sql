-- Migration: Layer 1 Alert Enrichment tables

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  hostname TEXT,
  ip_addresses TEXT[],
  criticality INTEGER DEFAULT 3 CHECK (criticality BETWEEN 1 AND 4),
  owner_team TEXT,
  network_zone TEXT,
  data_classification TEXT[],
  is_production BOOLEAN DEFAULT false,
  is_eol BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON assets USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  ioc_type TEXT NOT NULL,
  ioc_value TEXT NOT NULL,
  enrichment_data JSONB NOT NULL,
  source TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, ioc_type, ioc_value, source)
);
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON enrichment_cache USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  ioc_type TEXT NOT NULL,
  ioc_value TEXT NOT NULL,
  label TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON watchlists USING (org_id = current_setting('app.current_org_id')::uuid);
