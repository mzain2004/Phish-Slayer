import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Deduplicates a new alert against existing alerts in a sliding 1-hour window.
 * Logic: group by (title, source_ip, org_id)
 */
export async function deduplicateAlert(
  supabase: SupabaseClient,
  alert: { title: string; source_ip: string | null; org_id: string }
): Promise<{ isDuplicate: boolean; groupId: string | null; count: number }> {
  try {
    const slidingWindowHours = 1;
    const cutoff = new Date(Date.now() - slidingWindowHours * 60 * 60 * 1000).toISOString();

    // Find the "head" alert of this group within the window
    // We look for the oldest non-suppressed open alert that matches the criteria
    const { data: headAlert, error } = await supabase
      .from("alerts")
      .select("id, dedup_count, dedup_group_id")
      .eq("org_id", alert.org_id)
      .eq("title", alert.title)
      .eq("source_ip", alert.source_ip || "")
      .eq("status", "open")
      .or('is_suppressed.is.null,is_suppressed.eq.false')
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[dedup] Database error:", error);
      return { isDuplicate: false, groupId: null, count: 1 };
    }

    if (headAlert) {
      const newCount = (headAlert.dedup_count || 1) + 1;
      const groupId = headAlert.dedup_group_id || headAlert.id;

      // Update the head alert with new count and group ID if not set
      const { error: updateError } = await supabase
        .from("alerts")
        .update({ 
          dedup_count: newCount,
          dedup_group_id: groupId 
        })
        .eq("id", headAlert.id);

      if (updateError) {
        console.error("[dedup] Update error:", updateError);
      }

      return { isDuplicate: true, groupId, count: newCount };
    }

    // No duplicate found
    return { isDuplicate: false, groupId: null, count: 1 };
  } catch (error) {
    console.error("[dedup] Unexpected error:", error);
    return { isDuplicate: false, groupId: null, count: 1 };
  }
}
