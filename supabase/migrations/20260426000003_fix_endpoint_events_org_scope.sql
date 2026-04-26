CREATE OR REPLACE FUNCTION get_endpoint_stats(p_organization_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'threat_level_counts', (
      SELECT COALESCE(json_object_agg(threat_level, count), '{}'::json)
      FROM (
        SELECT e.threat_level, COUNT(*) as count
        FROM endpoint_events e
        JOIN organization_members tu ON e.user_id = tu.user_id::text
        WHERE tu.organization_id = p_organization_id
        GROUP BY e.threat_level
      ) t
    ),
    'top_remote_addresses', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT e.remote_address, COUNT(*) as count
        FROM endpoint_events e
        JOIN organization_members tu ON e.user_id = tu.user_id::text
        WHERE tu.organization_id = p_organization_id
        GROUP BY e.remote_address
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'top_processes', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT e.process_name, COUNT(*) as count
        FROM endpoint_events e
        JOIN organization_members tu ON e.user_id = tu.user_id::text
        WHERE tu.organization_id = p_organization_id
        GROUP BY e.process_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
