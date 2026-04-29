import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rebalances the priority queue when critical alerts arrive.
 */
export async function rebalanceQueue(supabase: SupabaseClient, orgId: string) {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Find medium alerts (priority 50) older than 2hr with no ACK
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("id")
      .eq("org_id", orgId)
      .eq("queue_priority", 50)
      .eq("status", "open")
      .is("acknowledged_by", null)
      .lte("created_at", twoHoursAgo);

    if (error || !alerts || alerts.length === 0) return;

    // De-prioritize to 10 (Deferred)
    const alertIds = alerts.map(a => a.id);
    await supabase
      .from("alerts")
      .update({ queue_priority: 10 })
      .in("id", alertIds);

    console.log(`[rebalancer] De-prioritized ${alertIds.length} stale alerts for org ${orgId}`);
  } catch (err) {
    console.error("[rebalancer] Error:", err);
  }
}
