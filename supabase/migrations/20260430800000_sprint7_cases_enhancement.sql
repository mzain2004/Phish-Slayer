-- Sprint 7: Case Management Enhancement

-- Enhance cases table
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE public.cases ALTER COLUMN organization_id TYPE UUID USING organization_id::UUID;
ALTER TABLE public.cases ADD CONSTRAINT cases_status_check 
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CONTAINED', 'REMEDIATED', 'CLOSED', 'ARCHIVED'));

-- Enhance case_timeline table
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.case_timeline ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enhance case_evidence table
ALTER TABLE public.case_evidence ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public.case_evidence ADD COLUMN IF NOT EXISTS alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL;
ALTER TABLE public.case_evidence ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.case_evidence ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE public.case_evidence ADD COLUMN IF NOT EXISTS collected_by TEXT;
ALTER TABLE public.case_evidence ADD COLUMN IF NOT EXISTS hash_sha256 TEXT;

-- Update RLS Policies to be org-scoped (standardizing across platform)
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;

CREATE POLICY "Allow members to select cases" ON public.cases
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to insert cases" ON public.cases
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

CREATE POLICY "Allow members to update cases" ON public.cases
    FOR UPDATE USING (organization_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

-- Do the same for timeline and evidence
DROP POLICY IF EXISTS "Users can view case timeline" ON public.case_timeline;
DROP POLICY IF EXISTS "Users can insert case timeline" ON public.case_timeline;
CREATE POLICY "Allow members to select timeline" ON public.case_timeline
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));
CREATE POLICY "Allow members to insert timeline" ON public.case_timeline
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can view case evidence" ON public.case_evidence;
DROP POLICY IF EXISTS "Users can insert case evidence" ON public.case_evidence;
CREATE POLICY "Allow members to select evidence" ON public.case_evidence
    FOR SELECT USING (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));
CREATE POLICY "Allow members to insert evidence" ON public.case_evidence
    FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM tenant_users WHERE user_id = auth.uid()::text));
