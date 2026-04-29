import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculates final severity based on asset criticality and tags.
 */
export async function getAlertCriticality(
  supabase: SupabaseClient,
  alert: { source_ip: string | null; hostname?: string | null; severity_level: number; org_id: string }
): Promise<number> {
  try {
    let query = supabase
      .from("asset_inventory")
      .select("criticality, asset_tags")
      .eq("organization_id", alert.org_id);

    if (alert.source_ip) {
      query = query.contains("ip_addresses", [alert.source_ip]);
    } else if (alert.hostname) {
      query = query.eq("hostname", alert.hostname);
    } else {
      return alert.severity_level;
    }

    const { data: assets, error } = await query;

    if (error || !assets || assets.length === 0) return alert.severity_level;

    const asset = assets[0];
    let finalSeverity = alert.severity_level;

    // Logic: 
    // If asset criticality=critical -> auto-elevate to 15 (max)
    // If asset is executive device -> 15
    const isExecutive = asset.asset_tags?.includes("executive");
    
    if (asset.criticality === "critical" || isExecutive) {
      finalSeverity = 15; 
    } else if (asset.criticality === "high" && finalSeverity < 12) {
      finalSeverity = 12;
    }

    return finalSeverity;
  } catch (err) {
    console.error("[criticality] Error:", err);
    return alert.severity_level;
  }
}
