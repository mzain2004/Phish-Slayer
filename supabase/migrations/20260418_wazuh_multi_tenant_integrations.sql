-- NOTE: The codebase uses organizations as the multi-tenant boundary and
-- connectors (connector_type = 'wazuh') for Wazuh integrations.

ALTER TABLE public.connectors
  ADD COLUMN IF NOT EXISTS api_key_hash text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS manager_ip text;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS organization_id uuid;

DO $$
BEGIN
  IF to_regclass('public.audit_log') IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      id,
      user_id,
      action,
      resource_type,
      resource_id,
      payload,
      ip_address,
      user_agent,
      created_at,
      metadata,
      organization_id
    )
    SELECT
      al.id,
      al.user_id,
      al.action,
      al.resource_type,
      al.resource_id,
      COALESCE(al.details, '{}'::jsonb) as payload,
      CASE
        WHEN al.ip_address IS NULL THEN NULL
        WHEN al.ip_address ~ '^[0-9]{1,3}(\\.[0-9]{1,3}){3}(/\\d{1,2})?$' THEN al.ip_address::inet
        WHEN al.ip_address ~ '^[0-9A-Fa-f:]+(/\\d{1,3})?$' THEN al.ip_address::inet
        ELSE NULL
      END as ip_address,
      al.user_agent,
      al.created_at,
      jsonb_strip_nulls(
        jsonb_build_object(
          'legacy_user_email', al.user_email,
          'legacy_user_role', al.user_role,
          'legacy_ip_address', al.ip_address
        )
      ) as metadata,
      NULL::uuid as organization_id
    FROM public.audit_log al
    WHERE NOT EXISTS (SELECT 1 FROM public.audit_logs a2 WHERE a2.id = al.id);

    DROP TABLE public.audit_log;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_connectors_org_type
  ON public.connectors(organization_id, connector_type);

CREATE INDEX IF NOT EXISTS idx_connectors_last_seen_at
  ON public.connectors(last_seen_at DESC);
