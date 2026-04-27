-- Add organization_id to tenant_users for RLS policy consistency
-- Fixes schema inconsistency between tenant_users (tenant_id) and other tables (organization_id)

BEGIN;

-- 1. Add organization_id column to tenant_users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                     AND table_name = 'tenant_users' 
                     AND column_name = 'organization_id') THEN
        ALTER TABLE public.tenant_users ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- 2. Sync organization_id from tenants table where NULL
UPDATE public.tenant_users tu
SET organization_id = t.id
FROM public.tenants t
WHERE tu.tenant_id = t.id 
  AND tu.organization_id IS NULL;

-- 3. Add FK constraint
ALTER TABLE public.tenant_users 
ADD CONSTRAINT fk_tenant_users_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Ensure NEW rows get organization_id automatically
CREATE OR REPLACE FUNCTION public.set_tenant_users_organization()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
        NEW.organization_id := NEW.tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create or replace trigger
DROP TRIGGER IF EXISTS set_organization_on_tenant_users ON public.tenant_users;
CREATE TRIGGER set_organization_on_tenant_users
    BEFORE INSERT OR UPDATE ON public.tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_tenant_users_organization();

COMMIT;