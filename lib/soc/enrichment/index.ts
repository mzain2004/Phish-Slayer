import { SupabaseClient } from "@supabase/supabase-js";
import { EnrichmentResult, IOC } from "../types";
import { enrichIP } from "./ip";
import { enrichDomain } from "./domain";
import { enrichHash } from "./hash";
import { enrichEmail } from "./email";
import { checkIOCAgainstIntel } from "../intel/index";

export async function enrichIOC(ioc: IOC, supabase: SupabaseClient, organization_id: string): Promise<EnrichmentResult> {
  // Check Threat Intel first (Fast Lookup)
  const intelHit = await checkIOCAgainstIntel(ioc.value, ioc.type, supabase, organization_id);
  if (intelHit && intelHit.confidence > 80) {
    return {
      ioc_type: ioc.type,
      value: ioc.value,
      malicious: true,
      confidence_score: intelHit.confidence,
      sources: [{ name: intelHit.source, malicious: true, score: intelHit.confidence, raw: intelHit.raw_data, error: null }],
      cached: true,
      enriched_at: new Date(intelHit.last_seen),
      raw_data: intelHit.raw_data,
      tags: intelHit.tags,
      country: null,
      asn: null,
      threat_type: intelHit.threat_type
    };
  }

  switch (ioc.type) {
    case "ip":
      return enrichIP(ioc.value, organization_id, supabase);
    case "domain":
      return enrichDomain(ioc.value, organization_id, supabase);
    case "hash":
      return enrichHash(ioc.value, organization_id, supabase);
    case "email":
      return enrichEmail(ioc.value, organization_id, supabase);
    case "url":
      try {
        const url = new URL(ioc.value);
        return enrichDomain(url.hostname, organization_id, supabase);
      } catch {
        return enrichDomain(ioc.value, organization_id, supabase);
      }
    default:
      throw new Error(`Unsupported IOC type: ${ioc.type}`);
  }
}

export async function enrichBatch(iocs: IOC[], supabase: SupabaseClient, organization_id: string): Promise<EnrichmentResult[]> {
  const startTime = Date.now();
  const results = await Promise.allSettled(iocs.map(ioc => enrichIOC(ioc, supabase, organization_id)));
  
  const finalResults: EnrichmentResult[] = results.map((res, i) => {
    if (res.status === "fulfilled") {
      return res.value;
    } else {
      // Fallback for failed enrichment
      return {
        ioc_type: iocs[i].type,
        value: iocs[i].value,
        malicious: false,
        confidence_score: 0,
        sources: [{ name: "Error", malicious: null, score: null, raw: null, error: String(res.reason) }],
        cached: false,
        enriched_at: new Date(),
        raw_data: null,
        tags: [],
        country: null,
        asn: null,
        threat_type: "Enrichment Error"
      } as EnrichmentResult;
    }
  });

  const duration = Date.now() - startTime;
  const cacheHits = finalResults.filter(r => r.cached).length;
  console.info(`[enrichment] batch_size=${iocs.length} duration_ms=${duration} cache_hits=${cacheHits}`);

  return finalResults;
}

export function getEnrichmentSummary(results: EnrichmentResult[]) {
  const malicious = results.filter(r => r.malicious);
  const suspicious = results.filter(r => !r.malicious && r.confidence_score > 50);
  const clean = results.filter(r => !r.malicious && r.confidence_score <= 50);

  return {
    malicious_count: malicious.length,
    suspicious_count: suspicious.length,
    clean_count: clean.length,
    cache_hit_rate: results.length > 0 ? (results.filter(r => r.cached).length / results.length) * 100 : 0,
    top_threats: malicious.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 5)
  };
}
