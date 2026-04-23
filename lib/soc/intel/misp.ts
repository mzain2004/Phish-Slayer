import { SupabaseClient } from "@supabase/supabase-js";
import { MISPEvent, ThreatIntelEntry } from "../types";
import { v4 as uuidv4 } from "uuid";

export async function fetchMISPEvents(limit: number = 100): Promise<MISPEvent[]> {
  const mispUrl = process.env.MISP_URL;
  const mispApiKey = process.env.MISP_API_KEY;

  if (!mispUrl || !mispApiKey) {
    console.warn("[misp] MISP credentials not set, skipping fetch");
    return [];
  }

  try {
    const res = await fetch(`${mispUrl}/events/index.json`, {
      headers: {
        "Authorization": mispApiKey,
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error(`MISP fetch failed: ${res.statusText}`);
    
    const data = await res.json();
    return (data || []).slice(0, limit);
  } catch (error) {
    console.error("[misp] Error fetching events:", error);
    return [];
  }
}

export async function syncMISPFeed(supabase: SupabaseClient): Promise<number> {
  const events = await fetchMISPEvents();
  let newEntries = 0;

  for (const event of events) {
    if (!event.attributes) continue;

    for (const attr of event.attributes) {
      if (!attr.to_ids) continue;

      let iocType: any = null;
      if (["ip-src", "ip-dst"].includes(attr.type)) iocType = "ip";
      else if (["domain", "hostname"].includes(attr.type)) iocType = "domain";
      else if (["md5", "sha1", "sha256"].includes(attr.type)) iocType = "hash";
      else if (attr.type === "email-src") iocType = "email";
      else if (attr.type === "url") iocType = "url";

      if (!iocType) continue;

      const { data: existing } = await supabase
        .from("threat_intel")
        .select("id")
        .eq("value", attr.value)
        .maybeSingle();

      const entryData = {
        source: "misp",
        ioc_type: iocType,
        value: attr.value,
        threat_type: event.info || "MISP Attribute",
        confidence: 75,
        severity: "high",
        tags: event.tags || [],
        last_seen: new Date().toISOString(),
        raw_data: attr,
        active: true
      };

      if (!existing) {
        await supabase.from("threat_intel").insert({
          ...entryData,
          id: uuidv4(),
          first_seen: new Date().toISOString()
        });
        newEntries++;
      } else {
        await supabase.from("threat_intel").update(entryData).eq("id", existing.id);
      }
    }
  }

  return newEntries;
}
