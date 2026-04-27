-- Critical Security Fixes Migration
-- Run after all other migrations
-- Created: 2026-04-27

BEGIN;

-- ============================================================
-- 1a. Add organization_id UUID column to tables (nullable first)
-- ============================================================

-- alert_groups
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'alert_groups' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.alert_groups ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- auto_close_log
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'auto_close_log' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.auto_close_log ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- ueba_anomalies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'ueba_anomalies' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.ueba_anomalies ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- hunt_findings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'hunt_findings' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.hunt_findings ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- threat_intel
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'threat_intel' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.threat_intel ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- ============================================================
-- 1b. Enable RLS on unprotected tables
-- ============================================================

-- attack_paths
ALTER TABLE public.attack_paths ENABLE ROW LEVEL SECURITY;

-- raw_logs
ALTER TABLE public.raw_logs ENABLE ROW LEVEL SECURITY;

-- pipeline_runs
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1c. Add org-scoped RLS policies to newly protected tables
-- ============================================================

-- attack_paths policies
DROP POLICY IF EXISTS "attack_paths_select_policy" ON public.attack_paths;
DROP POLICY IF EXISTS "attack_paths_insert_policy" ON public.attack_paths;
DROP POLICY IF EXISTS "attack_paths_update_policy" ON public.attack_paths;
DROP POLICY IF EXISTS "attack_paths_delete_policy" ON public.attack_paths;

CREATE POLICY "attack_paths_org_select" ON public.attack_paths
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "attack_paths_org_insert" ON public.attack_paths
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "attack_paths_org_update" ON public.attack_paths
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "attack_paths_org_delete" ON public.attack_paths
FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

-- raw_logs policies
DROP POLICY IF EXISTS "raw_logs_select_policy" ON public.raw_logs;
DROP POLICY IF EXISTS "raw_logs_insert_policy" ON public.raw_logs;
DROP POLICY IF EXISTS "raw_logs_update_policy" ON public.raw_logs;
DROP POLICY IF EXISTS "raw_logs_delete_policy" ON public.raw_logs;

CREATE POLICY "raw_logs_org_select" ON public.raw_logs
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "raw_logs_org_insert" ON public.raw_logs
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "raw_logs_org_update" ON public.raw_logs
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "raw_logs_org_delete" ON public.raw_logs
FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

-- pipeline_runs policies
DROP POLICY IF EXISTS "pipeline_runs_select_policy" ON public.pipeline_runs;
DROP POLICY IF EXISTS "pipeline_runs_insert_policy" ON public.pipeline_runs;
DROP POLICY IF EXISTS "pipeline_runs_update_policy" ON public.pipeline_runs;
DROP POLICY IF EXISTS "pipeline_runs_delete_policy" ON public.pipeline_runs;

CREATE POLICY "pipeline_runs_org_select" ON public.pipeline_runs
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "pipeline_runs_org_insert" ON public.pipeline_runs
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "pipeline_runs_org_update" ON public.pipeline_runs
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "pipeline_runs_org_delete" ON public.pipeline_runs
FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

-- ============================================================
-- 1d. Drop duplicate RLS policies on cases, create clean set
-- ============================================================

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cases' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cases', pol.policyname);
    END LOOP;
END $$;

-- Create clean org-scoped policies for cases
CREATE POLICY "cases_org_select" ON public.cases
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "cases_org_insert" ON public.cases
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "cases_org_update" ON public.cases
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "cases_org_delete" ON public.cases
FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

-- ============================================================
-- 1e. Add foreign key constraints
-- ============================================================

-- cases.organization_id -> organizations(id)
ALTER TABLE public.cases 
ADD CONSTRAINT fk_cases_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- ueba_profiles.organization_id -> organizations(id)
ALTER TABLE public.ueba_profiles 
ADD CONSTRAINT fk_ueba_profiles_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- hunt_missions.organization_id -> organizations(id)
ALTER TABLE public.hunt_missions 
ADD CONSTRAINT fk_hunt_missions_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- auto_close_log.organization_id -> organizations(id)
ALTER TABLE public.auto_close_log 
ADD CONSTRAINT fk_auto_close_log_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- ============================================================
-- 1f. Standardize RLS policies - Replace auth.uid() with auth.jwt()->>'sub'
-- ============================================================

-- organizations: drop old policies using auth.uid()
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'organizations' AND schemaname = 'public'
        AND policyname LIKE '%uid%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol.policyname);
    END LOOP;
END $$;

-- Recreate organizations policies with auth.jwt()->>'sub'
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

CREATE POLICY "organizations_org_select" ON public.organizations
FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "organizations_org_insert" ON public.organizations
FOR INSERT
WITH CHECK (
    owner_id = auth.jwt()->>'sub'
);

CREATE POLICY "organizations_org_update" ON public.organizations
FOR UPDATE
USING (
    id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
)
WITH CHECK (
    id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

-- soc_metrics: standardize to auth.jwt()->>'sub'
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'soc_metrics' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.soc_metrics', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "soc_metrics_org_select" ON public.soc_metrics
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "soc_metrics_org_insert" ON public.soc_metrics
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

-- agent_reasoning: standardize to auth.jwt()->>'sub'
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'agent_reasoning' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.agent_reasoning', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "agent_reasoning_org_select" ON public.agent_reasoning
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

CREATE POLICY "agent_reasoning_org_insert" ON public.agent_reasoning
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
    )
);

COMMIT;