import { SupabaseClient } from "@supabase/supabase-js";
import { EnrichmentResult, EnrichmentSource } from "../types";

export async function enrichDomain(domain: string, orgId: string, supabase: SupabaseClient): Promise<EnrichmentResult> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ioc_store")
    .select("*")
    .eq("ioc_type", "domain")
    .eq("value", domain)
    .eq("organization_id", orgId)
    .gte("last_seen", twentyFourHoursAgo)
    .maybeSingle();

  if (cached && cached.enrichment) {
    return { ...cached.enrichment, cached: true, enriched_at: new Date(cached.last_seen) };
  }

  const sources: EnrichmentSource[] = [];
  const results = await Promise.allSettled([
    // Source 1: VirusTotal
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const apiKey = process.env.VIRUS_TOTAL_API_KEY;
        if (!apiKey) throw new Error("Missing VIRUS_TOTAL_API_KEY");
        const res = await fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
          headers: { "x-apikey": apiKey }
        });
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
        const data = res.status === 404 ? {} : await res.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        const maliciousCount = stats?.malicious || 0;
        return {
          name: "VirusTotal",
          malicious: maliciousCount > 2,
          score: maliciousCount,
          raw: data.data,
          error: null
        };
      } catch (err) {
        console.error('[Enrichment] VirusTotal fetch failed:', err);
        return null;
      }
    })(),

    // Source 2: WHOIS
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const res = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const creationDate = data.creation_date ? new Date(data.creation_date) : null;
        const isNew = creationDate ? (Date.now() - creationDate.getTime()) < (30 * 24 * 60 * 60 * 1000) : false;
        return {
          name: "WHOIS",
          malicious: isNew,
          score: isNew ? 1 : 0,
          raw: data,
          error: null
        };
      } catch (err) {
        console.error('[Enrichment] WHOIS fetch failed:', err);
        return null;
      }
    })(),

    // Source 3: SecurityTrails
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const apiKey = process.env.SECURITYTRAILS_API_KEY;
        if (!apiKey) return null;
        const res = await fetch(`https://api.securitytrails.com/v1/domain/${domain}`, {
          headers: { APIKEY: apiKey }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return {
          name: "SecurityTrails",
          malicious: null,
          score: null,
          raw: data,
          error: null
        };
      } catch (err) {
        console.error('[Enrichment] SecurityTrails fetch failed:', err);
        return null;
      }
    })()
  ]);

  results.forEach((res) => {
    if (res.status === "fulfilled" && res.value) {
      sources.push(res.value);
    }
  });

  const vt = sources.find(s => s.name === "VirusTotal");
  const whois = sources.find(s => s.name === "WHOIS");
  
  const isNewlyRegistered = whois?.malicious === true;
  const vtMalicious = vt?.malicious === true;
  const vtScore = vt?.score || 0;

  const finalMalicious = vtMalicious || (isNewlyRegistered && (vtScore as number) > 0);
  
  const result: EnrichmentResult = {
    ioc_type: "domain",
    value: domain,
    malicious: finalMalicious,
    confidence_score: finalMalicious ? 90 : 0,
    sources,
    cached: false,
    enriched_at: new Date(),
    raw_data: { vt: vt?.raw, whois: whois?.raw },
    tags: vt?.raw?.tags || [],
    country: whois?.raw?.registrant_country || null,
    asn: null,
    threat_type: vtMalicious ? "Malicious Domain" : (isNewlyRegistered ? "Newly Registered Domain" : null)
  };

  await supabase.from("ioc_store").upsert({
    ioc_type: "domain",
    value: domain,
    organization_id: orgId,
    enrichment: result,
    malicious: finalMalicious,
    confidence_score: result.confidence_score,
    last_seen: new Date().toISOString()
  }, { onConflict: "ioc_type,value" });

  return result;
}
