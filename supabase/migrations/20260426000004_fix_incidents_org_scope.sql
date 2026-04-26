-- Add organization_id
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Drop all existing policies on incidents
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'incidents' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.incidents', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_select"
ON public.incidents FOR SELECT
USING (
  organization_id IN (
    SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
  )
);

CREATE POLICY "org_scoped_insert"
ON public.incidents FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
  )
);

CREATE POLICY "org_scoped_update"
ON public.incidents FOR UPDATE
USING (
  organization_id IN (
    SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
  )
);

CREATE POLICY "org_scoped_delete"
ON public.incidents FOR DELETE
USING (
  organization_id IN (
    SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.jwt()->>'sub'
  )
);
