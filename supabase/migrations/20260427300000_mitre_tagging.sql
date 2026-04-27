-- MITRE ATT&CK Tagging Schema

-- Update alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS mitre_techniques TEXT[];
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS mitre_tagged_at TIMESTAMPTZ;

-- Mitre Alert Tags Table
CREATE TABLE IF NOT EXISTS mitre_alert_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    technique_id TEXT NOT NULL,
    technique_name TEXT,
    tactic TEXT,
    confidence FLOAT,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alert_id, technique_id)
);

CREATE INDEX IF NOT EXISTS idx_mitre_alert_tags_org ON mitre_alert_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_mitre_alert_tags_tech ON mitre_alert_tags(technique_id);
CREATE INDEX IF NOT EXISTS idx_mitre_alert_tags_tactic ON mitre_alert_tags(tactic);

-- Mitre Case Tags Table
CREATE TABLE IF NOT EXISTS mitre_case_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    technique_id TEXT NOT NULL,
    technique_name TEXT,
    tactic TEXT,
    confidence FLOAT,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(case_id, technique_id)
);

CREATE INDEX IF NOT EXISTS idx_mitre_case_tags_org ON mitre_case_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_mitre_case_tags_tech ON mitre_case_tags(technique_id);

-- Mitre Coverage Table
CREATE TABLE IF NOT EXISTS mitre_coverage (
    organization_id TEXT PRIMARY KEY,
    coverage JSONB NOT NULL,
    last_calculated TIMESTAMPTZ DEFAULT now(),
    total_techniques_seen INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE mitre_alert_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitre_case_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitre_coverage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Org access for mitre_alert_tags" ON mitre_alert_tags FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id'));
CREATE POLICY "Org access for mitre_case_tags" ON mitre_case_tags FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id'));
CREATE POLICY "Org access for mitre_coverage" ON mitre_coverage FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id'));
