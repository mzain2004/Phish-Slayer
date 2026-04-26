-- RPC for aggregated endpoint stats to avoid OOM
-- Created: 2026-04-26

CREATE OR REPLACE FUNCTION get_endpoint_stats(p_organization_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'threat_level_counts', (
      SELECT json_object_agg(threat_level, count)
      FROM (
        SELECT threat_level, COUNT(*) as count
        FROM endpoint_events
        WHERE organization_id = p_organization_id::text -- Casting to match if needed, or just use as is
        GROUP BY threat_level
      ) t
    ),
    'top_remote_addresses', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT remote_address, COUNT(*) as count
        FROM endpoint_events
        WHERE organization_id = p_organization_id::text
        GROUP BY remote_address
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'top_processes', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT process_name, COUNT(*) as count
        FROM endpoint_events
        WHERE organization_id = p_organization_id::text
        GROUP BY process_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
