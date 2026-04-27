-- CVSS and Threat Intel Enrichment Schema

-- Add columns to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS cvss_max_score FLOAT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS cvss_severity TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS cve_ids TEXT[];
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS mitre_techniques TEXT[];
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS threat_intel_enriched BOOLEAN DEFAULT false;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- CVE Cache Table
CREATE TABLE IF NOT EXISTS cve_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cve_id TEXT UNIQUE NOT NULL,
    cvss_v3_score FLOAT,
    cvss_v3_vector TEXT,
    cvss_v3_severity TEXT,
    cvss_v2_score FLOAT,
    description TEXT,
    published_date TIMESTAMPTZ,
    cwe_ids TEXT[],
    affected_products JSONB,
    references JSONB,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_cve_cache_cve_id ON cve_cache(cve_id);
CREATE INDEX IF NOT EXISTS idx_cve_cache_expires ON cve_cache(expires_at);

-- Threat Intel Enrichments Table
CREATE TABLE IF NOT EXISTS threat_intel_enrichments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    ioc_value TEXT NOT NULL,
    ioc_type TEXT NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'hash', 'url')),
    vt_score INTEGER,
    vt_total INTEGER,
    vt_categories JSONB,
    vt_last_analysis_date TIMESTAMPTZ,
    otx_pulses INTEGER,
    otx_tags TEXT[],
    abuse_confidence INTEGER,
    geo_country TEXT,
    geo_asn TEXT,
    geo_org TEXT,
    is_malicious BOOLEAN,
    enriched_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '6 hours')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_threat_intel_org_ioc ON threat_intel_enrichments(organization_id, ioc_value);

-- Enable RLS
ALTER TABLE threat_intel_enrichments ENABLE ROW LEVEL SECURITY;

-- Policies for threat_intel_enrichments
CREATE POLICY "Users can view their organization's threat intel"
ON threat_intel_enrichments FOR SELECT
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert threat intel for their organization"
ON threat_intel_enrichments FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can update their organization's threat intel"
ON threat_intel_enrichments FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can delete their organization's threat intel"
ON threat_intel_enrichments FOR DELETE
USING (organization_id = (auth.jwt() ->> 'org_id'));
