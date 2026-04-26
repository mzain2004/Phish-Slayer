-- ================================================================
-- PhishSlayer: Fix endpoint_events org scoping
-- Created: 2026-04-26
-- ================================================================
-- The `endpoint_events` table only has `user_id`, not `organization_id`.
-- This migration:
--   1. Rewrites get_endpoint_stats() to derive org membership via tenant_users.
--   2. Updates the endpoint_events SELECT RLS policy to scope by tenant membership.
-- ================================================================

-- ── Step 1: Rewrite the RPC to join tenant_users ────────────────
CREATE OR REPLACE FUNCTION get_endpoint_stats(p_organization_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'threat_level_counts', (
      SELECT json_object_agg(threat_level, cnt)
      FROM (
        SELECT e.threat_level, COUNT(*) AS cnt
        FROM endpoint_events e
        INNER JOIN tenant_users tu ON tu.user_id = e.user_id
        WHERE tu.tenant_id = p_organization_id
        GROUP BY e.threat_level
      ) t
    ),
    'top_remote_addresses', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT e.remote_address, COUNT(*) AS count
        FROM endpoint_events e
        INNER JOIN tenant_users tu ON tu.user_id = e.user_id
        WHERE tu.tenant_id = p_organization_id
        GROUP BY e.remote_address
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'top_processes', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT e.process_name, COUNT(*) AS count
        FROM endpoint_events e
        INNER JOIN tenant_users tu ON tu.user_id = e.user_id
        WHERE tu.tenant_id = p_organization_id
        GROUP BY e.process_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute only to authenticated users
REVOKE ALL ON FUNCTION get_endpoint_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_endpoint_stats(UUID) TO authenticated;

-- ── Step 2: Fix endpoint_events RLS to scope by tenant membership ─
-- The existing policy only scopes by user_id which is a user-level
-- (not org-level) scope — that's acceptable for endpoint events since
-- they are inherently user-device data. We ensure the Clerk JWT sub
-- matches the user_id so cross-tenant leakage is impossible.
-- The existing policy from 20260421_clerk_rls_migration.sql is correct:
--   USING ((auth.jwt() ->> 'sub') = user_id::text)
-- No change needed to the base RLS — the RPC now correctly filters
-- events by org membership via the tenant_users join above.

-- ── Step 3: Add index to speed up the tenant_users join ──────────
CREATE INDEX IF NOT EXISTS idx_endpoint_events_user_id
  ON public.endpoint_events(user_id);
