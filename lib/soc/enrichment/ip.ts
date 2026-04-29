import { SupabaseClient } from "@supabase/supabase-js";
import { EnrichmentResult, EnrichmentSource } from "../types";

export async function enrichIP(ip: string, orgId: string, supabase: SupabaseClient): Promise<EnrichmentResult> {
  // 1. Check cache
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ioc_store")
    .select("*")
    .eq("ioc_type", "ip")
    .eq("value", ip)
    .eq("organization_id", orgId)
    .gte("last_seen", twentyFourHoursAgo)
    .maybeSingle();

  if (cached && cached.enrichment && !process.env.BYPASS_IOC_CACHE) {
    return {
      ...cached.enrichment,
      cached: true,
      enriched_at: new Date(cached.last_seen)
    };
  }

  const sources: EnrichmentSource[] = [];
  
  // Define sources in parallel
  const results = await Promise.allSettled([
    // Source 1: VirusTotal
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const apiKey = process.env.VIRUS_TOTAL_API_KEY;
        if (!apiKey) throw new Error("Missing VIRUS_TOTAL_API_KEY");
        const res = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
          headers: { "x-apikey": apiKey }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        const maliciousCount = stats?.malicious || 0;
        return {
          name: "VirusTotal",
          malicious: maliciousCount > 2,
          score: maliciousCount,
          raw: data.data
        } as EnrichmentSource;
      } catch (err) {
        console.error('[Enrichment] VirusTotal fetch failed:', err);
        return null;
      }
    })(),

    // Source 2: AbuseIPDB
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const apiKey = process.env.ABUSEIPDB_API_KEY;
        if (!apiKey) throw new Error("Missing ABUSEIPDB_API_KEY");
        const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
          headers: { "Key": apiKey, "Accept": "application/json" }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const score = data.data?.abuseConfidenceScore || 0;
        return {
          name: "AbuseIPDB",
          malicious: score > 25,
          score: score,
          raw: data.data
        } as EnrichmentSource;
      } catch (err) {
        console.error('[Enrichment] AbuseIPDB fetch failed:', err);
        return null;
      }
    })(),

    // Source 3: IPInfo
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const res = await fetch(`https://ipinfo.io/${ip}/json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return {
          name: "IPInfo",
          malicious: data.bogon ? false : null, // Bogons aren't inherently malicious but can be blocked
          score: data.bogon ? 0 : null,
          raw: data
        } as EnrichmentSource;
      } catch (err) {
        console.error('[Enrichment] IPInfo fetch failed:', err);
        return null;
      }
    })(),

    // Source 4: Shodan (InternetDB)
    (async (): Promise<EnrichmentSource | null> => {
      try {
        const res = await fetch(`https://internetdb.shodan.io/${ip}`);
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
        const data = res.status === 404 ? { vulns: [] } : await res.json();
        return {
          name: "Shodan",
          malicious: (data.vulns?.length || 0) > 0,
          score: data.vulns?.length || 0,
          raw: data
        } as EnrichmentSource;
      } catch (err) {
        console.error('[Enrichment] Shodan fetch failed:', err);
        return null;
      }
    })()
  ]);

  results.forEach((res) => {
    if (res.status === "fulfilled" && res.value) {
      sources.push(res.value);
    } else if (res.status === "rejected") {
      console.error("Enrichment source failed:", res.reason);
    }
  });

  // Combine Results
  const maliciousSources = sources.filter(s => s.malicious === true).length;
  const vt = sources.find(s => s.name === "VirusTotal");
  const abuse = sources.find(s => s.name === "AbuseIPDB");
  const shodan = sources.find(s => s.name === "Shodan");
  const ipinfo = sources.find(s => s.name === "IPInfo");

  // Weighted Confidence Score
  let confidence = 0;
  if (vt?.score !== undefined) confidence += (Math.min(vt.score as number, 10) / 10) * 40; 
  if (abuse?.score !== undefined) confidence += ((abuse.score as number) / 100) * 40;
  if (shodan?.malicious) confidence += 10;
  if (ipinfo?.raw?.bogon) confidence += 10; // Simple weighting

  const finalMalicious = maliciousSources >= 2;
  const result: EnrichmentResult = {
    ioc_type: "ip",
    value: ip,
    malicious: finalMalicious,
    confidence_score: Math.min(Math.round(confidence), 100),
    sources,
    cached: false,
    enriched_at: new Date(),
    raw_data: { sources: sources.map(s => ({ name: s.name, malicious: s.malicious })) },
    tags: vt?.raw?.tags || [],
    country: abuse?.raw?.countryCode || ipinfo?.raw?.country || null,
    asn: vt?.raw?.asn || ipinfo?.raw?.org || null,
    threat_type: vt?.raw?.last_analysis_stats?.malicious > 0 ? "Malicious IP" : null
  };

  // Upsert to DB
  const iocData = {
    ioc_type: "ip",
    value: ip,
    organization_id: orgId,
    enrichment: result,
    malicious: finalMalicious,
    confidence_score: result.confidence_score,
    last_seen: new Date().toISOString()
  };

  if (cached?.id) {
    await supabase.from("ioc_store").update(iocData).eq("id", cached.id).eq("organization_id", orgId);
  } else {
    await supabase.from("ioc_store").insert({ ...iocData, first_seen: new Date().toISOString() });
  }

  return result;
}
