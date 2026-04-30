import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks an alert as a false positive and stores its fingerprint.
 */
export async function markFalsePositive(
  supabase: SupabaseClient,
  alertId: string,
  orgId: string,
  analystId: string
) {
  try {
    // 1. Get alert data
    const { data: alert, error: fetchError } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (fetchError || !alert) {
      console.error("[fp] Alert not found:", alertId);
      return;
    }

    // 2. Update alert
    await supabase
      .from("alerts")
      .update({
        is_false_positive: true,
        fp_marked_by: analystId,
        fp_marked_at: new Date().toISOString(),
        status: "closed" // Automatically close FP alerts
      })
      .eq("id", alertId);

    // 3. Extract fingerprint
    const fingerprint = {
      organization_id: orgId,
      rule_id: alert.alert_type,
      source_ip: alert.source_ip,
      destination_port: alert.raw_log?.destination_port || null,
      alert_type: alert.alert_type,
      marked_by: analystId
    };

    // 4. Store fingerprint (upsert pattern)
    const { data: existing } = await supabase
      .from("fp_fingerprints")
      .select("id, hit_count")
      .eq("organization_id", orgId)
      .eq("rule_id", fingerprint.rule_id)
      .eq("source_ip", fingerprint.source_ip || "")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("fp_fingerprints")
        .update({ 
          hit_count: (existing.hit_count || 1) + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .eq("organization_id", orgId);
    } else {
      await supabase
        .from("fp_fingerprints")
        .insert(fingerprint);
    }
  } catch (error) {
    console.error("[fp] Unexpected error in markFalsePositive:", error);
  }
}

/**
 * Checks if a new alert matches known false positive fingerprints.
 */
export async function checkFalsePositive(
  supabase: SupabaseClient,
  alert: { 
    title: string; 
    source_ip: string | null; 
    alert_type: string; 
    raw_log: any;
    org_id: string;
  }
): Promise<{ isFP: boolean; confidence: number }> {
  try {
    const { data: fingerprints, error } = await supabase
      .from("fp_fingerprints")
      .select("*")
      .eq("organization_id", alert.org_id)
      .eq("alert_type", alert.alert_type);

    if (error || !fingerprints || fingerprints.length === 0) {
      return { isFP: false, confidence: 0 };
    }

    let maxConfidence = 0;

    for (const fp of fingerprints) {
      let confidence = 0;

      // Exact match
      if (fp.source_ip === alert.source_ip) {
        confidence = 1.0;
      } 
      // Partial match (same rule + same IP range /24)
      else if (fp.source_ip && alert.source_ip) {
        const fpParts = fp.source_ip.split('.');
        const alertParts = alert.source_ip.split('.');
        if (fpParts.length === 4 && alertParts.length === 4) {
          const fpPrefix = fpParts.slice(0, 3).join('.');
          const alertPrefix = alertParts.slice(0, 3).join('.');
          if (fpPrefix === alertPrefix) {
            confidence = 0.7;
          }
        }
      }

      if (confidence > maxConfidence) {
        maxConfidence = confidence;
      }
    }

    return { 
      isFP: maxConfidence > 0.8, 
      confidence: maxConfidence 
    };
  } catch (error) {
    console.error("[fp] Unexpected error in checkFalsePositive:", error);
    return { isFP: false, confidence: 0 };
  }
}
