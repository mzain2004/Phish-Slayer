-- Migration: UDM and Ingestion

CREATE TABLE IF NOT EXISTS udm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  connector_id UUID, -- Removed REFERENCES connectors(id) for now if table doesn't exist
  data_source_type TEXT NOT NULL,
  timestamp_utc TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT now(),
  clock_skew_ms INTEGER DEFAULT 0,
  src_ip INET,
  dst_ip INET,
  src_port INTEGER,
  dst_port INTEGER,
  protocol TEXT,
  host_name TEXT,
  host_fqdn TEXT,
  host_os TEXT,
  user_name TEXT,
  user_domain TEXT,
  process_name TEXT,
  process_pid INTEGER,
  process_cmdline TEXT,
  process_hash_sha256 TEXT,
  file_path TEXT,
  file_hash_sha256 TEXT,
  dns_query TEXT,
  http_url TEXT,
  http_method TEXT,
  event_type TEXT NOT NULL,
  event_action TEXT,
  event_outcome TEXT,
  event_category TEXT[],
  alert_rule_id TEXT,
  alert_rule_name TEXT,
  alert_severity_score INTEGER,
  raw_log TEXT NOT NULL,
  normalization_version TEXT DEFAULT '1.0',
  normalization_warnings TEXT[],
  extra JSONB DEFAULT '{}'  -- overflow for unmapped fields
);

ALTER TABLE udm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON udm_events
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Performance indexes
CREATE INDEX idx_udm_org_timestamp
  ON udm_events(org_id, timestamp_utc DESC);
CREATE INDEX idx_udm_src_ip
  ON udm_events(org_id, src_ip);
CREATE INDEX idx_udm_host
  ON udm_events(org_id, host_name);
CREATE INDEX idx_udm_user
  ON udm_events(org_id, user_name);
CREATE INDEX idx_udm_process
  ON udm_events(org_id, process_hash_sha256);

CREATE TABLE IF NOT EXISTS connector_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  connector_id UUID NOT NULL,
  status TEXT DEFAULT 'healthy',
  last_event_at TIMESTAMPTZ,
  events_per_min_current DECIMAL(10,2),
  events_per_min_baseline DECIMAL(10,2),
  consecutive_silent_checks INTEGER DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT now(),
  health_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE connector_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON connector_health
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE TABLE IF NOT EXISTS udm_events_archive (
  id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  timestamp_utc TIMESTAMPTZ NOT NULL,
  compressed_data JSONB NOT NULL,
  original_count INTEGER DEFAULT 1,
  archived_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE udm_events_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON udm_events_archive
  USING (org_id = current_setting('app.current_org_id')::uuid);
