ALTER TABLE public.endpoint_events ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE public.endpoint_events
SET organization_id = tenant_users.tenant_id
FROM public.tenant_users
WHERE endpoint_events.user_id = tenant_users.user_id
  AND endpoint_events.organization_id IS NULL;
