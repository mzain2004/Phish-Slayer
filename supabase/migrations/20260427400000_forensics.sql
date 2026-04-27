-- Forensic Investigation Engine Tables

-- Forensic Chain of Custody (Immutable Log)
CREATE TABLE IF NOT EXISTS forensic_custody (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    state_hash TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Case Evidence
CREATE TABLE IF NOT EXISTS case_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    content_hash TEXT NOT NULL,
    added_by TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    mitre_techniques TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Forensic Reports
CREATE TABLE IF NOT EXISTS forensic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now(),
    report_data JSONB NOT NULL,
    generated_by TEXT DEFAULT 'ai',
    version INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE forensic_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_reports ENABLE ROW LEVEL SECURITY;

-- Policies for forensic_custody (Immutable: Insert + Select Only)
CREATE POLICY "Users can view custody for their org" ON forensic_custody
    FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert custody for their org" ON forensic_custody
    FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

-- Policies for case_evidence
CREATE POLICY "Users can view evidence for their org" ON case_evidence
    FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert evidence for their org" ON case_evidence
    FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can update evidence for their org" ON case_evidence
    FOR UPDATE USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can delete evidence for their org" ON case_evidence
    FOR DELETE USING (organization_id = (auth.jwt() ->> 'org_id'));

-- Policies for forensic_reports
CREATE POLICY "Users can view reports for their org" ON forensic_reports
    FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can insert reports for their org" ON forensic_reports
    FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can update reports for their org" ON forensic_reports
    FOR UPDATE USING (organization_id = (auth.jwt() ->> 'org_id'));

-- Indices
CREATE INDEX IF NOT EXISTS idx_custody_case ON forensic_custody(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON case_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_case ON forensic_reports(case_id);
