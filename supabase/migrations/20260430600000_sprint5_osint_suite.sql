-- Sprint 5: Full OSINT Agent Suite

-- Agent 1: Paste Site Monitor Archives
CREATE TABLE IF NOT EXISTS paste_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    paste_url TEXT NOT NULL,
    paste_content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 2: Credential Leak Monitor
CREATE TABLE IF NOT EXISTS credential_exposures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    breach_name TEXT NOT NULL,
    breach_date DATE,
    data_classes TEXT[] DEFAULT '{}',
    remediation_status TEXT DEFAULT 'pending' CHECK (remediation_status IN ('pending', 'notified', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 3: Email Security Posture
CREATE TABLE IF NOT EXISTS email_posture_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    spf_record TEXT,
    spf_status TEXT,
    dkim_status TEXT,
    dmarc_record TEXT,
    dmarc_status TEXT,
    relay_test_result TEXT,
    security_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 4: Infrastructure Footprint (Attack Surface)
CREATE TABLE IF NOT EXISTS attack_surface (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    host TEXT,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    service TEXT,
    banner TEXT,
    vulnerabilities JSONB DEFAULT '[]',
    tls_details JSONB DEFAULT '{}',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, ip, port)
);

-- Agent 5: Vulnerability Intelligence Tracking
CREATE TABLE IF NOT EXISTS vuln_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cve_id TEXT NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    priority_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'mitigated', 'closed')),
    is_kev BOOLEAN DEFAULT FALSE,
    has_poc BOOLEAN DEFAULT FALSE,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE paste_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_posture_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_surface ENABLE ROW LEVEL SECURITY;
ALTER TABLE vuln_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow members to select paste_archives" ON paste_archives FOR SELECT USING (true);
CREATE POLICY "Allow members to insert paste_archives" ON paste_archives FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow members to select credential_exposures" ON credential_exposures FOR SELECT USING (true);
CREATE POLICY "Allow members to insert credential_exposures" ON credential_exposures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update credential_exposures" ON credential_exposures FOR UPDATE USING (true);

CREATE POLICY "Allow members to select email_posture_results" ON email_posture_results FOR SELECT USING (true);
CREATE POLICY "Allow members to insert email_posture_results" ON email_posture_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow members to select attack_surface" ON attack_surface FOR SELECT USING (true);
CREATE POLICY "Allow members to insert attack_surface" ON attack_surface FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update attack_surface" ON attack_surface FOR UPDATE USING (true);

CREATE POLICY "Allow members to select vuln_tracking" ON vuln_tracking FOR SELECT USING (true);
CREATE POLICY "Allow members to insert vuln_tracking" ON vuln_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow members to update vuln_tracking" ON vuln_tracking FOR UPDATE USING (true);
