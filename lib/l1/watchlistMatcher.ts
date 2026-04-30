import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Matches alert entities against the organization's watchlist.
 */
export async function matchWatchlist(
  supabase: SupabaseClient,
  alert: { 
    source_ip: string | null; 
    raw_log: any;
    org_id: string;
  }
): Promise<{ isMatch: boolean; reason?: string; entities: string[] }> {
  try {
    const entitiesToMatch: { type: string, value: string }[] = [];
    
    if (alert.source_ip) {
      entitiesToMatch.push({ type: 'ip', value: alert.source_ip });
    }

    // Extract from raw_log
    const log = alert.raw_log || {};
    if (log.domain) entitiesToMatch.push({ type: 'domain', value: log.domain });
    if (log.email) entitiesToMatch.push({ type: 'email', value: log.email });
    if (log.user || log.username) entitiesToMatch.push({ type: 'user', value: log.user || log.username });
    if (log.hash || log.file_hash) entitiesToMatch.push({ type: 'hash', value: log.hash || log.file_hash });

    if (entitiesToMatch.length === 0) return { isMatch: false, entities: [] };

    const { data: matches, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("organization_id", alert.org_id)
      .in("entity_value", entitiesToMatch.map(e => e.value));

    if (error || !matches || matches.length === 0) return { isMatch: false, entities: [] };

    const matchedEntities = matches.map(m => m.entity_value);
    const reason = matches.map(m => m.reason).filter(Boolean).join(", ");

    // Update hit counts asynchronously
    for (const match of matches) {
      void supabase
        .from("watchlist")
        .update({ 
          hit_count: (match.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq("id", match.id)
        .eq("organization_id", alert.org_id);
    }

    return { 
      isMatch: true, 
      reason, 
      entities: matchedEntities 
    };
  } catch (error) {
    console.error("[watchlist] Unexpected error in matchWatchlist:", error);
    return { isMatch: false, entities: [] };
  }
}
