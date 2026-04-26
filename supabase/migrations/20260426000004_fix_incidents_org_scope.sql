-- 1. Add organization_id if it does not exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'incidents' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.incidents ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- 2. Drop all existing RLS policies on incidents
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'incidents' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.incidents', pol.policyname);
    END LOOP;
END $$;

-- 3. Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 4. Create new org-scoped policies
CREATE POLICY "incidents_org_select" ON public.incidents
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.jwt()->>'sub'
    )
);

CREATE POLICY "incidents_org_insert" ON public.incidents
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.jwt()->>'sub'
    )
);

CREATE POLICY "incidents_org_update" ON public.incidents
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.jwt()->>'sub'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.jwt()->>'sub'
    )
);

CREATE POLICY "incidents_org_delete" ON public.incidents
FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.jwt()->>'sub'
    )
);
