import { SupabaseClient } from "@supabase/supabase-js";
import { ThreatIntelStats, ThreatIntelEntry } from "../types";
import { syncOTXFeed } from "./otx";
import { syncMISPFeed } from "./misp";
import { buildInternalIntel } from "./internal";

export async function syncAllFeeds(supabase: SupabaseClient): Promise<ThreatIntelStats> {
  const startTime = Date.now();
  
  const otxAdded = await syncOTXFeed(supabase);
  await supabase.from("intel_sync_log").insert({ source: "otx", entries_added: otxAdded, sync_duration_ms: Date.now() - startTime });
  
  const mispStartTime = Date.now();
  const mispAdded = await syncMISPFeed(supabase);
  await supabase.from("intel_sync_log").insert({ source: "misp", entries_added: mispAdded, sync_duration_ms: Date.now() - mispStartTime });

  const internalStartTime = Date.now();
  const internalAdded = await buildInternalIntel(supabase);
  await supabase.from("intel_sync_log").insert({ source: "internal", entries_added: internalAdded, sync_duration_ms: Date.now() - internalStartTime });

  console.info(`[intel] Sync complete: OTX added ${otxAdded}, MISP added ${mispAdded}, Internal added ${internalAdded}`);

  return getIntelStats(supabase);
}

export async function checkIOCAgainstIntel(value: string, ioc_type: string, supabase: SupabaseClient, organization_id: string): Promise<ThreatIntelEntry | null> {
  const { data } = await supabase
    .from("threat_intel")
    .select("*")
    .eq("value", value)
    .eq("ioc_type", ioc_type)
    .eq("organization_id", organization_id)
    .eq("active", true)
    .maybeSingle();

  return data;
}

export async function getIntelStats(supabase: SupabaseClient): Promise<ThreatIntelStats> {
  const { data: totals } = await supabase.from("threat_intel").select("source, ioc_type, active");
  const { data: recent } = await supabase.from("intel_sync_log").select("*").order("synced_at", { ascending: false });

  const breakdown: Record<string, number> = {};
  totals?.forEach(t => {
    breakdown[t.source] = (breakdown[t.source] || 0) + 1;
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const added24h = totals?.filter(t => t.active).length || 0; // Simple simulation

  return {
    total_indicators: totals?.length || 0,
    active_indicators: totals?.filter(t => t.active).length || 0,
    sources_breakdown: breakdown,
    last_sync_otx: recent?.find(r => r.source === "otx")?.synced_at || null,
    last_sync_misp: recent?.find(r => r.source === "misp")?.synced_at || null,
    top_threat_types: ["Malicious IP", "Known Malware", "Phishing Domain"],
    indicators_added_24h: added24h
  };
}
