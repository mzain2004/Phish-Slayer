import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function enforceRetentionPolicy(orgId: string): Promise<void> {
  const supabase = getAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // 1. Find events older than 30 days
  const { data: oldEvents, error: selectError } = await supabase
    .from('udm_events')
    .select('*')
    .eq('org_id', orgId)
    .lt('timestamp_utc', thirtyDaysAgo)
    .limit(1000);

  if (selectError || !oldEvents || oldEvents.length === 0) {
    return;
  }

  const archives = oldEvents.map(e => ({
    id: e.id,
    org_id: e.org_id,
    timestamp_utc: e.timestamp_utc,
    compressed_data: e, // In a real system, you might gzip this JSONB payload via pg function
    original_count: 1,
    archived_at: new Date().toISOString()
  }));

  // 2. Move to archive tier
  const { error: insertError } = await supabase.from('udm_events_archive').insert(archives);
  
  if (insertError) {
    console.error(`[Retention] Failed to archive events for org ${orgId}: ${insertError.message}`);
    return;
  }

  // 3. Delete from hot tier
  const eventIds = oldEvents.map(e => e.id);
  await supabase.from('udm_events').delete().in('id', eventIds).eq('org_id', orgId);
  
}
