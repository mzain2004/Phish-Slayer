import { SupabaseClient } from "@supabase/supabase-js";
import { ThreatIntelEntry } from "../types";
import { v4 as uuidv4 } from "uuid";

export async function buildInternalIntel(supabase: SupabaseClient): Promise<number> {
  const { data: maliciousIOCs } = await supabase
    .from("ioc_store")
    .select("*")
    .eq("malicious", true)
    .gt("confidence_score", 70);

  if (!maliciousIOCs) return 0;

  let synced = 0;
  for (const ioc of maliciousIOCs) {
    const { data: existing } = await supabase
      .from("threat_intel")
      .select("id")
      .eq("value", ioc.value)
      .eq("source", "internal")
      .maybeSingle();

    const entryData = {
      source: "internal",
      ioc_type: ioc.ioc_type,
      value: ioc.value,
      threat_type: "Internal Confirmed Threat",
      confidence: ioc.confidence_score,
      severity: ioc.confidence_score > 85 ? "critical" : "high",
      tags: ["internal", "confirmed"],
      last_seen: new Date().toISOString(),
      raw_data: ioc,
      active: true,
      case_id: ioc.case_id
    };

    if (!existing) {
      await supabase.from("threat_intel").insert({
        ...entryData,
        id: uuidv4(),
        first_seen: new Date().toISOString()
      });
      synced++;
    } else {
      await supabase.from("threat_intel").update(entryData).eq("id", existing.id);
    }
  }

  return synced;
}

export async function checkInternalIntel(value: string, ioc_type: string, supabase: SupabaseClient): Promise<ThreatIntelEntry | null> {
  const { data } = await supabase
    .from("threat_intel")
    .select("*")
    .eq("value", value)
    .eq("ioc_type", ioc_type)
    .eq("source", "internal")
    .eq("active", true)
    .maybeSingle();

  return data;
}
