import { createClient } from "@/lib/supabase/server";
import { enrichIP } from "./ip";
import { enrichDomain } from "./domain";
import { enrichHash } from "./hash";

export type IOCType = "ip" | "domain" | "hash";

export async function enrichIOC(type: IOCType, value: string, caseId?: string) {
  const supabase = await createClient();

  // Check cache (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: cached } = await supabase
    .from("ioc_store")
    .select("*")
    .eq("ioc_type", type)
    .eq("value", value)
    .gte("last_seen", twentyFourHoursAgo)
    .maybeSingle();

  if (cached && cached.enrichment) {
    return cached.enrichment;
  }

  // Perform enrichment
  let enrichment: any;
  let malicious = false;
  let confidence = 0;

  switch (type) {
    case "ip":
      enrichment = await enrichIP(value);
      malicious = (enrichment.abuseConfidenceScore || 0) > 50;
      confidence = enrichment.abuseConfidenceScore || 0;
      break;
    case "domain":
      enrichment = await enrichDomain(value);
      const stats = enrichment?.attributes?.last_analysis_stats;
      malicious = (stats?.malicious || 0) > 0;
      confidence = malicious ? 100 : 0;
      break;
    case "hash":
      enrichment = await enrichHash(value);
      malicious = enrichment.query_status === "ok";
      confidence = malicious ? 100 : 0;
      break;
  }

  // Store in cache
  const iocData = {
    case_id: caseId,
    ioc_type: type,
    value: value,
    enrichment: enrichment,
    malicious: malicious,
    confidence_score: confidence,
    last_seen: new Date().toISOString()
  };

  if (cached?.id) {
    await supabase.from("ioc_store").update(iocData).eq("id", cached.id);
  } else {
    await supabase.from("ioc_store").insert({ ...iocData, first_seen: new Date().toISOString() });
  }

  return enrichment;
}
