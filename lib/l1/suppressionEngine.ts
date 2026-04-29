import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks if an alert should be suppressed based on active suppression rules.
 */
export async function checkSuppression(
  supabase: SupabaseClient,
  alert: { 
    title: string; 
    source_ip: string | null; 
    severity_level: number; 
    raw_log: any;
    org_id: string;
  }
): Promise<{ suppressed: boolean; ruleId?: string }> {
  try {
    const { data: rules, error } = await supabase
      .from("suppression_rules")
      .select("*")
      .eq("organization_id", alert.org_id)
      .eq("is_active", true);

    if (error || !rules) return { suppressed: false };

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    for (const rule of rules) {
      // Expiration check
      if (rule.expires_at && new Date(rule.expires_at) < now) continue;

      let matched = false;

      switch (rule.rule_type) {
        case 'ip':
          if (alert.source_ip === rule.match_value) matched = true;
          break;
        case 'domain':
          const domain = alert.raw_log?.domain || alert.raw_log?.extra_fields?.domain;
          if (domain === rule.match_value) matched = true;
          break;
        case 'severity':
          if (alert.severity_level <= parseInt(rule.match_value || "0")) matched = true;
          break;
        case 'rule_name':
          if (alert.title.toLowerCase().includes((rule.match_value || "").toLowerCase())) matched = true;
          break;
        case 'time_window':
          if (rule.time_start && rule.time_end) {
            // Simple time comparison
            if (currentTime >= rule.time_start && currentTime <= rule.time_end) {
              matched = true;
            }
          }
          break;
      }

      if (matched) {
        // Increment hit count asynchronously
        void supabase.rpc('increment_suppression_hit', { rule_id: rule.id });
        
        return { suppressed: true, ruleId: rule.id };
      }
    }

    return { suppressed: false };
  } catch (error) {
    console.error("[suppression] Unexpected error:", error);
    return { suppressed: false };
  }
}
